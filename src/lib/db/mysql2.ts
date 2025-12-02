import mysql from 'mysql2/promise'

// Database 2 Configuration (Direct connection, no SSH tunnel)
const DB_CONFIG_2 = {
  host: process.env.DB_HOST2,
  port: parseInt(process.env.DB_PORT2 || '3308'),
  user: process.env.DB_USERNAME2,
  password: process.env.DB_PASSWORD2,
  database: process.env.DB_DATABASE2,
}

// Validate required environment variables
function validateEnvVars2() {
  const required = ['DB_HOST2', 'DB_USERNAME2', 'DB_PASSWORD2', 'DB_DATABASE2']
  
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`❌ Missing required environment variable: ${key}`)
    }
  }
}

// Create connection pool for DB2
let pool2: mysql.Pool | null = null

export async function getPool2() {
  if (!pool2) {
    // Validate env vars before creating pool
    validateEnvVars2()
    
    const config = DB_CONFIG_2
    
    if (!config.host || !config.user || !config.password || !config.database) {
      throw new Error('❌ Database 2 configuration incomplete. Check .env.local file.')
    }

    console.log(`🔌 Using DB2: ${config.host}:${config.port}/${config.database}`)
    
    pool2 = mysql.createPool({
      host: config.host,
      port: config.port,
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
    
    console.log(`✅ Database 2 pool created: ${config.host}:${config.port}`)
  }
  return pool2
}

// Execute query helper for DB2
export async function executeQuery2<T = any>(
  query: string,
  params: any[] = []
): Promise<T[]> {
  try {
    const pool = await getPool2()
    const [rows] = await pool.execute(query, params)
    return rows as T[]
  } catch (error) {
    console.error('❌ Database 2 query error:', error)
    throw error
  }
}

// Test connection for DB2
export async function testConnection2(): Promise<boolean> {
  try {
    const pool = await getPool2()
    const connection = await pool.getConnection()
    await connection.ping()
    connection.release()
    console.log('✅ Database 2 connection successful')
    return true
  } catch (error) {
    console.error('❌ Database 2 connection failed:', error)
    return false
  }
}

// Close pool for DB2
export async function closePool2(): Promise<void> {
  if (pool2) {
    await pool2.end()
    pool2 = null
    console.log('🔌 Database 2 pool closed')
  }
}
