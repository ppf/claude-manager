import { spawn, ChildProcess } from 'child_process'
import { EventEmitter } from 'events'
import type { MCPServer } from '@/types/claude-config'

export type ProcessStatus = 'stopped' | 'starting' | 'running' | 'failed' | 'restarting'

export interface MCPProcess {
  id: string
  process: ChildProcess | null
  status: ProcessStatus
  pid?: number
  startedAt?: Date
  restartCount: number
  logs: string[]
  error?: string
}

interface ProcessState {
  [serverId: string]: MCPProcess
}

/**
 * Ring buffer for logs - keeps last N lines
 */
class LogBuffer {
  private buffer: string[] = []
  private maxSize: number

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize
  }

  push(line: string): void {
    this.buffer.push(line)
    if (this.buffer.length > this.maxSize) {
      this.buffer.shift()
    }
  }

  get(count?: number): string[] {
    if (!count) return [...this.buffer]
    return this.buffer.slice(-count)
  }

  clear(): void {
    this.buffer = []
  }
}

/**
 * MCP Process Manager
 * Handles lifecycle management for MCP servers with health monitoring and auto-restart
 */
export class MCPProcessManager extends EventEmitter {
  private processes: ProcessState = {}
  private readonly MAX_RESTART_ATTEMPTS = 2
  private readonly HEARTBEAT_INTERVAL = 10000 // 10 seconds

  /**
   * Start an MCP server process
   */
  async start(server: MCPServer): Promise<MCPProcess> {
    // If already running, return existing process
    if (this.processes[server.id]?.status === 'running') {
      return this.processes[server.id]
    }

    // Initialize process state
    const logBuffer = new LogBuffer()
    this.processes[server.id] = {
      id: server.id,
      process: null,
      status: 'starting',
      restartCount: 0,
      logs: [],
    }

    try {
      // Spawn process
      const childProcess = spawn(server.command, server.args || [], {
        env: { ...process.env, ...server.env },
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: false,
      })

      // Update process state
      this.processes[server.id].process = childProcess
      this.processes[server.id].pid = childProcess.pid
      this.processes[server.id].startedAt = new Date()
      this.processes[server.id].status = 'running'

      // Capture stdout
      childProcess.stdout?.on('data', (data: Buffer) => {
        const lines = data.toString().split('\n').filter((l) => l.trim())
        lines.forEach((line) => {
          logBuffer.push(`[stdout] ${line}`)
          this.emit('log', { serverId: server.id, level: 'info', message: line })
        })
        this.processes[server.id].logs = logBuffer.get()
      })

      // Capture stderr
      childProcess.stderr?.on('data', (data: Buffer) => {
        const lines = data.toString().split('\n').filter((l) => l.trim())
        lines.forEach((line) => {
          logBuffer.push(`[stderr] ${line}`)
          this.emit('log', { serverId: server.id, level: 'error', message: line })
        })
        this.processes[server.id].logs = logBuffer.get()
      })

      // Handle process exit
      childProcess.on('exit', (code, signal) => {
        const proc = this.processes[server.id]
        if (!proc) return

        const crashed = code !== 0 && code !== null

        this.emit('exit', {
          serverId: server.id,
          code,
          signal,
          crashed,
        })

        // Auto-restart on crash if under retry limit
        if (crashed && proc.restartCount < this.MAX_RESTART_ATTEMPTS) {
          proc.restartCount++
          proc.status = 'restarting'
          this.emit('restarting', { serverId: server.id, attempt: proc.restartCount })

          // Restart after 2 second delay
          setTimeout(() => {
            this.start(server).catch((err) => {
              this.emit('restart-failed', { serverId: server.id, error: err.message })
            })
          }, 2000)
        } else if (crashed) {
          // Max restarts reached
          proc.status = 'failed'
          proc.error = `Process crashed with code ${code}. Max restart attempts (${this.MAX_RESTART_ATTEMPTS}) reached.`
          this.emit('failed', { serverId: server.id, error: proc.error })
        } else {
          // Clean exit
          proc.status = 'stopped'
          proc.process = null
        }
      })

      // Handle process errors
      childProcess.on('error', (err) => {
        const proc = this.processes[server.id]
        if (!proc) return

        proc.status = 'failed'
        proc.error = err.message
        this.emit('error', { serverId: server.id, error: err.message })
      })

      return this.processes[server.id]
    } catch (error) {
      this.processes[server.id].status = 'failed'
      this.processes[server.id].error =
        error instanceof Error ? error.message : 'Unknown error'
      throw error
    }
  }

  /**
   * Stop an MCP server process
   */
  async stop(serverId: string): Promise<void> {
    const proc = this.processes[serverId]
    if (!proc || !proc.process) {
      throw new Error(`Process ${serverId} is not running`)
    }

    return new Promise((resolve, reject) => {
      const process = proc.process!

      // Set timeout for forceful kill
      const killTimeout = setTimeout(() => {
        if (!process.killed) {
          process.kill('SIGKILL')
          reject(new Error('Process did not terminate gracefully, killed forcefully'))
        }
      }, 5000)

      process.on('exit', () => {
        clearTimeout(killTimeout)
        proc.status = 'stopped'
        proc.process = null
        proc.restartCount = 0 // Reset restart count
        resolve()
      })

      // Send SIGTERM for graceful shutdown
      process.kill('SIGTERM')
    })
  }

  /**
   * Restart an MCP server process
   */
  async restart(server: MCPServer): Promise<MCPProcess> {
    const proc = this.processes[server.id]

    if (proc && proc.process) {
      await this.stop(server.id)
    }

    // Reset restart count on manual restart
    if (proc) {
      proc.restartCount = 0
    }

    return this.start(server)
  }

  /**
   * Get process status
   */
  getStatus(serverId: string): ProcessStatus {
    return this.processes[serverId]?.status || 'stopped'
  }

  /**
   * Get process information
   */
  getProcess(serverId: string): MCPProcess | null {
    return this.processes[serverId] || null
  }

  /**
   * Get logs for a server
   */
  getLogs(serverId: string, lines?: number): string[] {
    const proc = this.processes[serverId]
    if (!proc) return []

    if (lines) {
      return proc.logs.slice(-lines)
    }

    return proc.logs
  }

  /**
   * Check if process is alive (health check)
   */
  isAlive(serverId: string): boolean {
    const proc = this.processes[serverId]
    if (!proc || !proc.process) return false

    // Check if process exists and is not killed
    try {
      // Sending signal 0 checks if process exists without killing it
      return process.kill(proc.process.pid!, 0)
    } catch {
      return false
    }
  }

  /**
   * Get all processes
   */
  getAllProcesses(): ProcessState {
    return { ...this.processes }
  }

  /**
   * Stop all processes
   */
  async stopAll(): Promise<void> {
    const stopPromises = Object.keys(this.processes).map((id) => {
      if (this.processes[id].status === 'running') {
        return this.stop(id).catch((err) => {
          console.error(`Failed to stop ${id}:`, err)
        })
      }
      return Promise.resolve()
    })

    await Promise.all(stopPromises)
  }

  /**
   * Start health monitoring for all running processes
   */
  startHealthMonitoring(): void {
    setInterval(() => {
      Object.keys(this.processes).forEach((serverId) => {
        const proc = this.processes[serverId]
        if (proc.status === 'running' && !this.isAlive(serverId)) {
          this.emit('health-check-failed', { serverId })
          proc.status = 'failed'
          proc.error = 'Health check failed - process not responding'
        }
      })
    }, this.HEARTBEAT_INTERVAL)
  }
}

// Singleton instance
export const mcpProcessManager = new MCPProcessManager()

// Start health monitoring
mcpProcessManager.startHealthMonitoring()
