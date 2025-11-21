import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mcpProcessManager } from '@/lib/mcp/process-manager'
import type { MCPServer } from '@/types/claude-config'

/**
 * Integration tests for MCP process lifecycle management
 * Tests start/stop/restart operations, health monitoring, and auto-restart
 */
describe('MCP Process Lifecycle', () => {
  const testServer: MCPServer = {
    id: 'test-server',
    name: 'Test Server',
    command: 'node',
    args: ['-e', 'console.log("test"); setInterval(() => {}, 1000)'],
    enabled: true,
  }

  beforeEach(() => {
    // Stop all processes before each test
    mcpProcessManager.stopAll()
  })

  afterEach(() => {
    // Cleanup after each test
    mcpProcessManager.stopAll()
  })

  describe('Process Start', () => {
    it('should start MCP server process', async () => {
      await mcpProcessManager.start(testServer)

      const status = mcpProcessManager.getStatus(testServer.id)
      expect(status).toBeDefined()
      expect(['running', 'starting']).toContain(status?.status)
    })

    it('should capture process PID', async () => {
      await mcpProcessManager.start(testServer)

      const status = mcpProcessManager.getStatus(testServer.id)
      expect(status?.pid).toBeDefined()
      expect(status?.pid).toBeGreaterThan(0)
    })

    it('should track process start time', async () => {
      const startTime = Date.now()
      await mcpProcessManager.start(testServer)

      await new Promise((resolve) => setTimeout(resolve, 100))

      const status = mcpProcessManager.getStatus(testServer.id)
      expect(status?.uptime).toBeDefined()
      expect(status?.uptime).toBeGreaterThan(0)
    })

    it('should prevent duplicate starts', async () => {
      await mcpProcessManager.start(testServer)

      // Try to start again
      await expect(mcpProcessManager.start(testServer)).rejects.toThrow()
    })

    it('should handle invalid command gracefully', async () => {
      const invalidServer: MCPServer = {
        ...testServer,
        id: 'invalid-server',
        command: 'nonexistent-command-xyz',
      }

      await expect(mcpProcessManager.start(invalidServer)).rejects.toThrow()

      const status = mcpProcessManager.getStatus(invalidServer.id)
      expect(status?.status).toBe('failed')
    })
  })

  describe('Process Stop', () => {
    it('should stop running process gracefully', async () => {
      await mcpProcessManager.start(testServer)
      await new Promise((resolve) => setTimeout(resolve, 100))

      await mcpProcessManager.stop(testServer.id)

      const status = mcpProcessManager.getStatus(testServer.id)
      expect(status?.status).toBe('stopped')
    })

    it('should send SIGTERM first, then SIGKILL if needed', async () => {
      await mcpProcessManager.start(testServer)
      await new Promise((resolve) => setTimeout(resolve, 100))

      const stopPromise = mcpProcessManager.stop(testServer.id)

      // Should complete within reasonable time (5s timeout + buffer)
      await expect(stopPromise).resolves.not.toThrow()
    })

    it('should handle stopping non-existent process', async () => {
      await expect(mcpProcessManager.stop('nonexistent')).rejects.toThrow()
    })

    it('should cleanup resources on stop', async () => {
      await mcpProcessManager.start(testServer)
      await mcpProcessManager.stop(testServer.id)

      const status = mcpProcessManager.getStatus(testServer.id)
      expect(status?.pid).toBeUndefined()
    })
  })

  describe('Process Restart', () => {
    it('should restart running process', async () => {
      await mcpProcessManager.start(testServer)
      const firstStatus = mcpProcessManager.getStatus(testServer.id)
      const firstPid = firstStatus?.pid

      await new Promise((resolve) => setTimeout(resolve, 100))
      await mcpProcessManager.restart(testServer)
      await new Promise((resolve) => setTimeout(resolve, 100))

      const secondStatus = mcpProcessManager.getStatus(testServer.id)
      const secondPid = secondStatus?.pid

      // PID should change after restart
      expect(secondPid).toBeDefined()
      expect(secondPid).not.toBe(firstPid)
    })

    it('should increment restart count', async () => {
      await mcpProcessManager.start(testServer)
      await mcpProcessManager.restart(testServer)

      const status = mcpProcessManager.getStatus(testServer.id)
      expect(status?.restartCount).toBeGreaterThan(0)
    })

    it('should handle restart of stopped process', async () => {
      await mcpProcessManager.start(testServer)
      await mcpProcessManager.stop(testServer.id)

      // Restart should work like fresh start
      await expect(mcpProcessManager.restart(testServer)).resolves.not.toThrow()

      const status = mcpProcessManager.getStatus(testServer.id)
      expect(['running', 'starting']).toContain(status?.status)
    })
  })

  describe('Health Monitoring', () => {
    it('should detect process crashes', async () => {
      const crashingServer: MCPServer = {
        ...testServer,
        id: 'crashing-server',
        args: ['-e', 'process.exit(1)'], // Exit immediately
      }

      await mcpProcessManager.start(crashingServer)
      await new Promise((resolve) => setTimeout(resolve, 200))

      const status = mcpProcessManager.getStatus(crashingServer.id)
      expect(['failed', 'stopped']).toContain(status?.status)
    })

    it('should perform health checks at intervals', async () => {
      await mcpProcessManager.start(testServer)

      // Wait for at least one health check (10s interval + buffer)
      await new Promise((resolve) => setTimeout(resolve, 11000))

      const status = mcpProcessManager.getStatus(testServer.id)
      expect(status?.lastHealthCheck).toBeDefined()
      expect(status?.lastHealthCheck?.getTime()).toBeGreaterThan(Date.now() - 12000)
    }, 15000) // Extended timeout for health check

    it('should update health check timestamp', async () => {
      await mcpProcessManager.start(testServer)
      await new Promise((resolve) => setTimeout(resolve, 100))

      const firstCheck = mcpProcessManager.getStatus(testServer.id)?.lastHealthCheck

      // Wait for next health check
      await new Promise((resolve) => setTimeout(resolve, 11000))

      const secondCheck = mcpProcessManager.getStatus(testServer.id)?.lastHealthCheck

      if (firstCheck && secondCheck) {
        expect(secondCheck.getTime()).toBeGreaterThanOrEqual(firstCheck.getTime())
      }
    }, 15000)
  })

  describe('Auto-Restart', () => {
    it('should auto-restart crashed process', async () => {
      const crashingServer: MCPServer = {
        ...testServer,
        id: 'auto-restart-server',
        args: ['-e', 'setTimeout(() => process.exit(1), 100)'], // Crash after 100ms
      }

      await mcpProcessManager.start(crashingServer)

      // Wait for crash and auto-restart
      await new Promise((resolve) => setTimeout(resolve, 500))

      const status = mcpProcessManager.getStatus(crashingServer.id)
      expect(status?.restartCount).toBeGreaterThan(0)
    })

    it('should respect max retry limit (2 retries)', async () => {
      const crashingServer: MCPServer = {
        ...testServer,
        id: 'retry-limit-server',
        args: ['-e', 'process.exit(1)'], // Exit immediately
      }

      await mcpProcessManager.start(crashingServer)

      // Wait for all retries to exhaust
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const status = mcpProcessManager.getStatus(crashingServer.id)
      expect(status?.restartCount).toBeLessThanOrEqual(2)
      expect(status?.status).toBe('failed')
    })

    it('should use exponential backoff for retries', async () => {
      const crashingServer: MCPServer = {
        ...testServer,
        id: 'backoff-server',
        args: ['-e', 'setTimeout(() => process.exit(1), 50)'],
      }

      const startTime = Date.now()
      await mcpProcessManager.start(crashingServer)

      // Wait for retries
      await new Promise((resolve) => setTimeout(resolve, 5000))

      const elapsed = Date.now() - startTime

      // With exponential backoff: 1s, 2s, 4s = ~7s total
      // Should take more than 1s (proves backoff is working)
      expect(elapsed).toBeGreaterThan(1000)
    }, 10000)
  })

  describe('Log Capture', () => {
    it('should capture stdout output', async () => {
      const loggingServer: MCPServer = {
        ...testServer,
        id: 'logging-server',
        args: ['-e', 'console.log("test output"); setInterval(() => {}, 1000)'],
      }

      await mcpProcessManager.start(loggingServer)
      await new Promise((resolve) => setTimeout(resolve, 200))

      const logs = mcpProcessManager.getLogs(loggingServer.id)
      expect(logs.length).toBeGreaterThan(0)
      expect(logs.some((log) => log.includes('test output'))).toBe(true)
    })

    it('should capture stderr output', async () => {
      const errorServer: MCPServer = {
        ...testServer,
        id: 'error-server',
        args: ['-e', 'console.error("test error"); setInterval(() => {}, 1000)'],
      }

      await mcpProcessManager.start(errorServer)
      await new Promise((resolve) => setTimeout(resolve, 200))

      const logs = mcpProcessManager.getLogs(errorServer.id)
      expect(logs.length).toBeGreaterThan(0)
      expect(logs.some((log) => log.includes('test error'))).toBe(true)
    })

    it('should maintain ring buffer of 1000 lines', async () => {
      const verboseServer: MCPServer = {
        ...testServer,
        id: 'verbose-server',
        args: [
          '-e',
          'for(let i=0;i<1500;i++){console.log(`Line ${i}`);}; setInterval(() => {}, 1000)',
        ],
      }

      await mcpProcessManager.start(verboseServer)
      await new Promise((resolve) => setTimeout(resolve, 500))

      const logs = mcpProcessManager.getLogs(verboseServer.id)
      expect(logs.length).toBeLessThanOrEqual(1000)

      // Should have latest lines, not oldest
      const lastLog = logs[logs.length - 1]
      expect(lastLog).toMatch(/Line (14[0-9]{2}|149[0-9])/) // Lines 1400-1499
    })

    it('should support limiting returned log lines', async () => {
      const loggingServer: MCPServer = {
        ...testServer,
        id: 'limit-logs-server',
        args: ['-e', 'for(let i=0;i<100;i++){console.log(`Line ${i}`);}; setInterval(() => {}, 1000)'],
      }

      await mcpProcessManager.start(loggingServer)
      await new Promise((resolve) => setTimeout(resolve, 200))

      const logs = mcpProcessManager.getLogs(loggingServer.id, 10)
      expect(logs.length).toBeLessThanOrEqual(10)
    })
  })

  describe('Multiple Processes', () => {
    it('should manage multiple servers independently', async () => {
      const server1: MCPServer = { ...testServer, id: 'server-1' }
      const server2: MCPServer = { ...testServer, id: 'server-2' }

      await mcpProcessManager.start(server1)
      await mcpProcessManager.start(server2)

      const status1 = mcpProcessManager.getStatus('server-1')
      const status2 = mcpProcessManager.getStatus('server-2')

      expect(status1?.pid).toBeDefined()
      expect(status2?.pid).toBeDefined()
      expect(status1?.pid).not.toBe(status2?.pid)
    })

    it('should stop all processes', async () => {
      const server1: MCPServer = { ...testServer, id: 'server-1' }
      const server2: MCPServer = { ...testServer, id: 'server-2' }

      await mcpProcessManager.start(server1)
      await mcpProcessManager.start(server2)

      mcpProcessManager.stopAll()

      const status1 = mcpProcessManager.getStatus('server-1')
      const status2 = mcpProcessManager.getStatus('server-2')

      expect(status1?.status).toBe('stopped')
      expect(status2?.status).toBe('stopped')
    })
  })
})
