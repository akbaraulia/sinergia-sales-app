import mysql from 'mysql2/promise'
import fs from 'fs'
import path from 'path'
import { createSSHTunnel, closeActiveTunnel, getActiveTunnel } from './ssh-tunnel'

// Database configuration based on environment
const DB_CONFIG = {
  LIVE: {
    host: process.env.DB_LIVE_HOST,
    port: parseInt(process.env.DB_LIVE_PORT || '3306'),
    user: process.env.DB_LIVE_USER,
    password: process.env.DB_LIVE_PASSWORD,
    database: process.env.DB_LIVE_DATABASE,
    sshHost: process.env.SSH_LIVE_HOST,
    sshPort: parseInt(process.env.SSH_LIVE_PORT || '22'),
    sshUser: process.env.SSH_LIVE_USER,
    sshPassword: process.env.SSH_LIVE_PASSWORD,
    sshKeyPath: process.env.SSH_LIVE_PRIVATE_KEY_PATH,
  },
  DEV: {
    host: process.env.DB_DEV_HOST,
    port: parseInt(process.env.DB_DEV_PORT || '3306'),
    user: process.env.DB_DEV_USER,
    password: process.env.DB_DEV_PASSWORD,
    database: process.env.DB_DEV_DATABASE,
    sshHost: process.env.SSH_DEV_HOST,
    sshPort: parseInt(process.env.SSH_DEV_PORT || '22'),
    sshUser: process.env.SSH_DEV_USER,
    sshPassword: process.env.SSH_DEV_PASSWORD,
    sshKeyPath: process.env.SSH_DEV_PRIVATE_KEY_PATH,
  }
} as const

type DBEnvironment = 'LIVE' | 'DEV'

const USE_SSH_TUNNEL = process.env.USE_SSH_TUNNEL === 'true'

// Validate required environment variables
function validateEnvVars(env: DBEnvironment) {
  const prefix = env === 'LIVE' ? 'DB_LIVE' : 'DB_DEV'
  const required = ['HOST', 'USER', 'PASSWORD', 'DATABASE']
  
  for (const key of required) {
    const envKey = `${prefix}_${key}`
    if (!process.env[envKey]) {
      throw new Error(`❌ Missing required environment variable: ${envKey}`)
    }
  }

  // Validate SSH config if tunnel is enabled
  if (USE_SSH_TUNNEL) {
    const sshPrefix = env === 'LIVE' ? 'SSH_LIVE' : 'SSH_DEV'
    const sshRequired = ['HOST', 'PORT', 'USER']
    
    for (const key of sshRequired) {
      const envKey = `${sshPrefix}_${key}`
      if (!process.env[envKey]) {
        throw new Error(`❌ Missing required SSH environment variable: ${envKey}`)
      }
    }

    // Either password or key must be provided
    const sshPasswordKey = `${sshPrefix}_PASSWORD`
    const sshKeyPathKey = `${sshPrefix}_PRIVATE_KEY_PATH`
    if (!process.env[sshPasswordKey] && !process.env[sshKeyPathKey]) {
      throw new Error(`❌ SSH tunnel enabled but no SSH_${env}_PASSWORD or SSH_${env}_PRIVATE_KEY_PATH provided`)
    }
  }
}

// Get current database config based on environment
function getDBConfig() {
  const env = (process.env.DB_REPORTING_ENV || 'LIVE') as DBEnvironment
  
  // Validate env vars before creating config
  validateEnvVars(env)
  
  const config = DB_CONFIG[env]
  
  console.log(`🔌 Using ${env} database: ${config.host}:${config.port}/${config.database}`)
  if (USE_SSH_TUNNEL) {
    console.log(`🔐 SSH Tunnel enabled: ${config.sshUser}@${config.sshHost}:${config.sshPort}`)
  }
  
  return config
}

// Create connection pool
let pool: mysql.Pool | null = null

async function setupSSHTunnel(config: any): Promise<number> {
  try {
    // Read SSH private key if path is provided
    let privateKey: Buffer | undefined
    if (config.sshKeyPath) {
      const keyPath = path.resolve(process.cwd(), config.sshKeyPath)
      if (fs.existsSync(keyPath)) {
        privateKey = fs.readFileSync(keyPath)
        console.log(`🔑 SSH private key loaded from: ${config.sshKeyPath}`)
      } else {
        throw new Error(`❌ SSH private key not found at: ${keyPath}`)
      }
    }

    const sshConfig = {
      host: config.sshHost!,
      port: config.sshPort!,
      username: config.sshUser!,
      password: config.sshPassword,
      privateKey,
    }

    // Use localhost as target since we're SSH-ing to the same server where MySQL runs
    const dbTargetHost = '127.0.0.1' // MySQL on remote server listens on localhost
    const tunnel = await createSSHTunnel(sshConfig, dbTargetHost, config.port!)
    return tunnel.localPort
  } catch (error) {
    console.error('❌ Failed to create SSH tunnel:', error)
    throw error
  }
}

export async function getPool() {
  if (!pool) {
    const config = getDBConfig()
    
    if (!config.host || !config.user || !config.password || !config.database) {
      throw new Error('❌ Database configuration incomplete. Check .env.local file.')
    }

    let dbHost = config.host
    let dbPort = config.port

    // Setup SSH tunnel if enabled
    if (USE_SSH_TUNNEL) {
      try {
        const existingTunnel = getActiveTunnel()
        if (existingTunnel) {
          console.log(`🔄 Using existing SSH tunnel on port ${existingTunnel.localPort}`)
          dbHost = '127.0.0.1'
          dbPort = existingTunnel.localPort
        } else {
          console.log('🚇 Creating new SSH tunnel...')
          const localPort = await setupSSHTunnel(config)
          dbHost = '127.0.0.1'
          dbPort = localPort
        }
      } catch (error) {
        console.error('❌ SSH tunnel setup failed:', error)
        throw new Error('Failed to establish SSH tunnel. Check SSH credentials.')
      }
    }
    
    pool = mysql.createPool({
      host: dbHost,
      port: dbPort,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      connectTimeout: 10000, // 10 seconds
      charset: 'utf8mb4',
    })
    
    console.log(`✅ Database pool created: ${dbHost}:${dbPort}`)
  }
  return pool
}

// Execute query helper
export async function executeQuery<T = any>(
  query: string,
  params: any[] = []
): Promise<T[]> {
  try {
    const pool = await getPool()
    const [rows] = await pool.execute(query, params)
    return rows as T[]
  } catch (error) {
    console.error('❌ Database query error:', error)
    throw error
  }
}

// Test connection
export async function testConnection(): Promise<boolean> {
  try {
    const pool = await getPool()
    const connection = await pool.getConnection()
    await connection.ping()
    connection.release()
    console.log('✅ Database connection successful')
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return false
  }
}

// Close pool
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
  }
  await closeActiveTunnel()
}
