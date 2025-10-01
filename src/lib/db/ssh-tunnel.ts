import { Client } from 'ssh2'
import fs from 'fs'
import path from 'path'
import net from 'net'

interface SSHTunnelConfig {
  host: string
  port: number
  username: string
  password?: string
  privateKey?: Buffer
}

interface TunnelInfo {
  localPort: number
  close: () => Promise<void>
}

let activeTunnel: TunnelInfo | null = null

export async function createSSHTunnel(
  sshConfig: SSHTunnelConfig,
  dbHost: string,
  dbPort: number
): Promise<TunnelInfo> {
  // Reuse existing tunnel if available
  if (activeTunnel) {
    console.log('🔄 Reusing existing SSH tunnel')
    return activeTunnel
  }

  return new Promise((resolve, reject) => {
    const sshClient = new Client()
    let localServer: net.Server | null = null

    sshClient.on('ready', () => {
      console.log('✅ SSH connection established')

      // Create local TCP server
      localServer = net.createServer((clientSocket) => {
        console.log('🔗 New client connection to tunnel')
        
        // Forward connection through SSH
        sshClient.forwardOut(
          '127.0.0.1', // source address on remote
          0,           // source port on remote (0 = any)
          dbHost,      // destination address on remote (127.0.0.1 for localhost MySQL)
          dbPort,      // destination port on remote (3306)
          (err, serverSocket) => {
            if (err) {
              console.error('❌ SSH forwardOut error:', err)
              clientSocket.end()
              return
            }

            console.log('✅ SSH tunnel stream created')
            
            // Pipe data between client and server
            clientSocket.pipe(serverSocket).pipe(clientSocket)
            
            clientSocket.on('error', (err: Error) => {
              console.error('❌ Client socket error:', err)
            })
            
            serverSocket.on('error', (err: Error) => {
              console.error('❌ Server socket error:', err)
            })
          }
        )
      })

      // Listen on random available port
      localServer.listen(0, '127.0.0.1', () => {
        const address = localServer!.address() as net.AddressInfo
        const localPort = address.port
        
        console.log(`✅ SSH tunnel listening: localhost:${localPort} -> ${dbHost}:${dbPort}`)

        activeTunnel = {
          localPort,
          close: async () => {
            console.log('🔌 Closing SSH tunnel...')
            
            if (localServer) {
              await new Promise<void>((resolve) => {
                localServer!.close(() => {
                  console.log('✅ Local server closed')
                  resolve()
                })
              })
            }
            
            sshClient.end()
            activeTunnel = null
            console.log('✅ SSH tunnel closed')
          }
        }

        resolve(activeTunnel)
      })

      localServer.on('error', (err) => {
        console.error('❌ Local server error:', err)
        sshClient.end()
        reject(err)
      })
    })

    sshClient.on('error', (err) => {
      console.error('❌ SSH client error:', err)
      reject(err)
    })

    sshClient.on('close', () => {
      console.log('🔌 SSH connection closed')
      if (activeTunnel) {
        activeTunnel = null
      }
    })

    // Prepare SSH connection config
    const connectionConfig: any = {
      host: sshConfig.host,
      port: sshConfig.port,
      username: sshConfig.username,
      readyTimeout: 20000,
      keepaliveInterval: 10000,
    }

    if (sshConfig.password) {
      connectionConfig.password = sshConfig.password
    }

    if (sshConfig.privateKey) {
      connectionConfig.privateKey = sshConfig.privateKey
    }

    console.log(`🔌 Connecting SSH to ${sshConfig.username}@${sshConfig.host}:${sshConfig.port}...`)
    sshClient.connect(connectionConfig)
  })
}

export async function closeActiveTunnel() {
  if (activeTunnel) {
    await activeTunnel.close()
  }
}

export function getActiveTunnel(): TunnelInfo | null {
  return activeTunnel
}

