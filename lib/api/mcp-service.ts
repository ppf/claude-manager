import { spawn } from 'child_process'
import type { MCPServer } from '@/types/claude-config'
import {
  getAllClaudeMCPServers,
  getClaudeMCPServer,
  updateClaudeMCPServerStatus,
  createClaudeMCPTemplate,
  mcpServerExists,
} from './claude-mcp-config'
import { mcpProcessManager, type ProcessStatus } from '@/lib/mcp/process-manager'

export interface MCPServerStatus {
  running: boolean
  status: ProcessStatus
  pid?: number
  uptime?: number
  restartCount?: number
  lastHealthCheck?: Date
  error?: string
}

/**
 * Get all MCP servers from Claude's configuration
 */
export async function getAllServers(): Promise<MCPServer[]> {
  const servers = await getAllClaudeMCPServers()
  return servers.map((server) => ({
    ...server,
    status: mcpProcessManager.getStatus(server.id),
  }))
}

/**
 * Get a single MCP server
 */
export async function getServer(id: string): Promise<MCPServer | null> {
  const server = await getClaudeMCPServer(id)

  if (!server) return null

  return {
    ...server,
    status: mcpProcessManager.getStatus(id),
  }
}

/**
 * Add a new MCP server to a custom template
 */
export async function addServer(server: Omit<MCPServer, 'id'>): Promise<MCPServer> {
  // Generate ID from name
  const id = server.name.toLowerCase().replace(/[^a-z0-9-]/g, '-')

  // Check if server already exists
  if (await mcpServerExists(id)) {
    throw new Error(`Server with ID '${id}' already exists`)
  }

  // Create a custom template with this server
  // Use 'custom' template for user-added servers
  await createClaudeMCPTemplate('custom', {
    [id]: {
      command: server.command,
      args: server.args || [],
      env: server.env || {},
    },
  })

  // If server should be enabled, update settings
  if (server.enabled !== false) {
    await updateClaudeMCPServerStatus(id, true)
  }

  const newServer: MCPServer = {
    ...server,
    id,
    enabled: server.enabled !== false,
  }

  return newServer
}

/**
 * Update an existing MCP server
 * Note: For Claude-based config, we can only toggle enabled status
 * To modify command/args/env, the template file must be edited
 */
export async function updateServer(id: string, updates: Partial<MCPServer>): Promise<MCPServer> {
  const server = await getClaudeMCPServer(id)

  if (!server) {
    throw new Error(`Server '${id}' not found`)
  }

  // Stop server if it's running and being disabled
  if (updates.enabled === false && mcpProcessManager.getStatus(id) === 'running') {
    await stopServer(id)
  }

  // Update enabled status in settings.local.json
  if (typeof updates.enabled === 'boolean') {
    await updateClaudeMCPServerStatus(id, updates.enabled)
  }

  // Note: Other updates (command, args, env) require template file modification
  // This is a limitation of the current implementation
  // TODO: Implement template file editing for full CRUD support

  return {
    ...server,
    ...updates,
    id, // Preserve ID
  }
}

/**
 * Delete an MCP server
 * Note: For Claude-based config, this only disables the server
 * The actual removal requires editing/deleting the template file
 */
export async function deleteServer(id: string): Promise<void> {
  const server = await getClaudeMCPServer(id)

  if (!server) {
    throw new Error(`Server '${id}' not found`)
  }

  // Stop server if running
  if (mcpProcessManager.getStatus(id) !== 'stopped') {
    await stopServer(id)
  }

  // Disable the server in settings.local.json
  await updateClaudeMCPServerStatus(id, false)

  // TODO: For full deletion, remove from custom template if it exists there
}

/**
 * Start an MCP server
 */
export async function startServer(id: string): Promise<void> {
  const server = await getServer(id)

  if (!server) {
    throw new Error(`Server '${id}' not found`)
  }

  await mcpProcessManager.start(server)
}

/**
 * Stop an MCP server
 */
export async function stopServer(id: string): Promise<void> {
  await mcpProcessManager.stop(id)
}

/**
 * Restart an MCP server
 */
export async function restartServer(id: string): Promise<void> {
  const server = await getServer(id)

  if (!server) {
    throw new Error(`Server '${id}' not found`)
  }

  await mcpProcessManager.restart(server)
}

/**
 * Get server status with details
 */
export async function getServerStatus(serverId: string): Promise<MCPServerStatus> {
  const proc = mcpProcessManager.getProcess(serverId)

  if (!proc || proc.status === 'stopped') {
    return {
      running: false,
      status: 'stopped',
    }
  }

  const uptime = proc.startedAt ? Date.now() - proc.startedAt.getTime() : undefined

  return {
    running: proc.status === 'running',
    status: proc.status,
    pid: proc.pid,
    uptime,
    restartCount: proc.restartCount,
    lastHealthCheck: new Date(),
    error: proc.error,
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
export async function getServerLogs(id: string, lines?: number): Promise<string[]> {
  return mcpProcessManager.getLogs(id, lines)
}
