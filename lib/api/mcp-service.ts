import fs from 'fs/promises'
import { spawn, ChildProcess } from 'child_process'
import { CLAUDE_PATHS } from '@/lib/claude/paths'
import type { MCPServer } from '@/types/claude-config'

export interface MCPServerStatus {
  running: boolean
  pid?: number
  uptime?: number
  lastHealthCheck?: Date
  error?: string
}

interface RunningServer {
  process: ChildProcess
  startTime: number
  logs: string[]
}

// Track running server processes
const runningServers = new Map<string, RunningServer>()

/**
 * Get MCP config file path
 */
function getMCPConfigPath(): string {
  return process.env.MCP_CONFIG_PATH || CLAUDE_PATHS.MCP_CONFIG
}

/**
 * Read MCP configuration file
 */
export async function readMCPConfig(): Promise<Record<string, MCPServer>> {
  try {
    const configPath = getMCPConfigPath()
    const content = await fs.readFile(configPath, 'utf-8')
    const config = JSON.parse(content)

    // Convert to MCPServer format
    const servers: Record<string, MCPServer> = {}

    if (config.mcpServers && typeof config.mcpServers === 'object') {
      for (const [id, serverConfig] of Object.entries(config.mcpServers)) {
        const server = serverConfig as Record<string, unknown>
        servers[id] = {
          id,
          name: id,
          command: (server.command as string) || '',
          args: Array.isArray(server.args) ? (server.args as string[]) : [],
          env: (server.env as Record<string, string>) || {},
          enabled: (server.enabled as boolean) !== false,
        }
      }
    }

    return servers
  } catch (error) {
    // Config file might not exist yet
    console.warn('Failed to read MCP config:', error)
    return {}
  }
}

/**
 * Write MCP configuration file
 */
export async function writeMCPConfig(servers: Record<string, MCPServer>): Promise<void> {
  const configPath = getMCPConfigPath()

  // Convert to config file format
  const config = {
    mcpServers: Object.fromEntries(
      Object.entries(servers).map(([id, server]) => [
        id,
        {
          command: server.command,
          args: server.args || [],
          env: server.env || {},
          enabled: server.enabled,
        },
      ])
    ),
  }

  await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8')
}

/**
 * Get all MCP servers
 */
export async function getAllServers(): Promise<MCPServer[]> {
  const servers = await readMCPConfig()
  return Object.values(servers).map((server) => ({
    ...server,
    status: getServerStatusSync(server.id),
  }))
}

/**
 * Get a single MCP server
 */
export async function getServer(id: string): Promise<MCPServer | null> {
  const servers = await readMCPConfig()
  const server = servers[id]

  if (!server) return null

  return {
    ...server,
    status: getServerStatusSync(id),
  }
}

/**
 * Add a new MCP server
 */
export async function addServer(server: Omit<MCPServer, 'id'>): Promise<MCPServer> {
  const servers = await readMCPConfig()

  // Generate ID from name
  const id = server.name.toLowerCase().replace(/[^a-z0-9-]/g, '-')

  if (servers[id]) {
    throw new Error(`Server with ID '${id}' already exists`)
  }

  const newServer: MCPServer = {
    ...server,
    id,
    enabled: server.enabled !== false,
  }

  servers[id] = newServer
  await writeMCPConfig(servers)

  return newServer
}

/**
 * Update an existing MCP server
 */
export async function updateServer(id: string, updates: Partial<MCPServer>): Promise<MCPServer> {
  const servers = await readMCPConfig()

  if (!servers[id]) {
    throw new Error(`Server '${id}' not found`)
  }

  // Stop server if it's running and being disabled
  if (updates.enabled === false && runningServers.has(id)) {
    await stopServer(id)
  }

  servers[id] = {
    ...servers[id],
    ...updates,
    id, // Preserve ID
  }

  await writeMCPConfig(servers)

  return servers[id]
}

/**
 * Delete an MCP server
 */
export async function deleteServer(id: string): Promise<void> {
  const servers = await readMCPConfig()

  if (!servers[id]) {
    throw new Error(`Server '${id}' not found`)
  }

  // Stop server if running
  if (runningServers.has(id)) {
    await stopServer(id)
  }

  delete servers[id]
  await writeMCPConfig(servers)
}

/**
 * Start an MCP server
 */
export async function startServer(id: string): Promise<void> {
  const server = await getServer(id)

  if (!server) {
    throw new Error(`Server '${id}' not found`)
  }

  if (runningServers.has(id)) {
    throw new Error(`Server '${id}' is already running`)
  }

  const logs: string[] = []

  const childProcess = spawn(server.command, server.args || [], {
    env: { ...process.env, ...server.env },
    stdio: ['pipe', 'pipe', 'pipe'],
  })

  // Capture stdout
  childProcess.stdout?.on('data', (data: Buffer) => {
    const log = data.toString()
    logs.push(`[stdout] ${log}`)
    if (logs.length > 1000) logs.shift() // Keep last 1000 lines
  })

  // Capture stderr
  childProcess.stderr?.on('data', (data: Buffer) => {
    const log = data.toString()
    logs.push(`[stderr] ${log}`)
    if (logs.length > 1000) logs.shift()
  })

  // Handle process exit
  childProcess.on('exit', (code: number | null) => {
    logs.push(`[system] Process exited with code ${code}`)
    runningServers.delete(id)
  })

  runningServers.set(id, {
    process: childProcess,
    startTime: Date.now(),
    logs,
  })
}

/**
 * Stop an MCP server
 */
export async function stopServer(id: string): Promise<void> {
  const running = runningServers.get(id)

  if (!running) {
    throw new Error(`Server '${id}' is not running`)
  }

  running.process.kill()
  runningServers.delete(id)
}

/**
 * Get server status (synchronous)
 */
function getServerStatusSync(id: string): 'running' | 'stopped' | 'error' {
  const running = runningServers.get(id)

  if (!running) return 'stopped'

  // Check if process is still alive
  try {
    process.kill(running.process.pid!, 0)
    return 'running'
  } catch {
    return 'error'
  }
}

/**
 * Get server status with details
 */
export async function getServerStatus(serverId: string): Promise<MCPServerStatus> {
  const server = runningServers.get(serverId)

  if (!server) {
    return { running: false }
  }

  // Check if process is still alive
  try {
    process.kill(server.process.pid!, 0)
    return {
      running: true,
      pid: server.process.pid,
      uptime: Date.now() - server.startTime,
      lastHealthCheck: new Date(),
    }
  } catch {
    return {
      running: false,
      error: 'Process not found',
    }
  }
}

/**
 * Test MCP server connection
 */
export async function testMCPConnection(server: MCPServer): Promise<boolean> {
  return new Promise((resolve) => {
    const testProcess = spawn(server.command, server.args || [], {
      env: { ...process.env, ...server.env },
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    let started = false

    // If process outputs anything, consider it started
    testProcess.stdout?.on('data', () => {
      if (!started) {
        started = true
        testProcess.kill()
        resolve(true)
      }
    })

    testProcess.stderr?.on('data', () => {
      if (!started) {
        started = true
        testProcess.kill()
        resolve(true)
      }
    })

    // If process exits immediately, it failed
    testProcess.on('exit', (code) => {
      if (!started) {
        resolve(code === 0)
      }
    })

    // Timeout after 5 seconds
    setTimeout(() => {
      if (!started) {
        testProcess.kill()
        resolve(false)
      }
    }, 5000)
  })
}

/**
 * Get server logs
 */
export async function getServerLogs(id: string): Promise<string[]> {
  const running = runningServers.get(id)

  if (!running) {
    return ['Server is not running']
  }

  return running.logs
}
