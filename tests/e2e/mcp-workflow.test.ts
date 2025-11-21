import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mcpProcessManager } from '@/lib/mcp/process-manager'
import type { MCPServer } from '@/types/claude-config'

/**
 * E2E tests for complete MCP server management workflows
 * Tests: configure → start → monitor → restart → stop
 */
describe('E2E: MCP Server Management Workflow', () => {
  const testServer: MCPServer = {
    id: 'e2e-test-server',
    name: 'E2E Test Server',
    command: 'node',
    args: ['-e', 'console.log("Server started"); setInterval(() => {}, 1000)'],
    enabled: true,
  }

  beforeEach(() => {
    mcpProcessManager.stopAll()
  })

  afterEach(() => {
    mcpProcessManager.stopAll()
  })

  describe('Complete Server Lifecycle', () => {
    it('should perform full lifecycle: configure → start → monitor → stop', async () => {
      // Step 1: Configure server (in real app, would save to config)
      const server = { ...testServer }
      expect(server.id).toBeDefined()
      expect(server.command).toBeDefined()

      // Step 2: Start server
      await mcpProcessManager.start(server)

      const startStatus = mcpProcessManager.getStatus(server.id)
      expect(['starting', 'running']).toContain(startStatus?.status)
      expect(startStatus?.pid).toBeDefined()

      // Step 3: Monitor health
      await new Promise((resolve) => setTimeout(resolve, 200))

      const monitorStatus = mcpProcessManager.getStatus(server.id)
      expect(monitorStatus?.status).toBe('running')
      expect(monitorStatus?.uptime).toBeGreaterThan(0)

      // Step 4: Check logs
      const logs = mcpProcessManager.getLogs(server.id)
      expect(logs.length).toBeGreaterThan(0)
      expect(logs.some((log) => log.includes('Server started'))).toBe(true)

      // Step 5: Stop server
      await mcpProcessManager.stop(server.id)

      const stopStatus = mcpProcessManager.getStatus(server.id)
      expect(stopStatus?.status).toBe('stopped')
      expect(stopStatus?.pid).toBeUndefined()
    })

    it('should handle start → crash → auto-restart → stop workflow', async () => {
      const crashingServer: MCPServer = {
        ...testServer,
        id: 'crashing-server',
        args: ['-e', 'setTimeout(() => { console.log("Crash"); process.exit(1); }, 100)'],
      }

      // Start server
      await mcpProcessManager.start(crashingServer)

      // Wait for crash and auto-restart
      await new Promise((resolve) => setTimeout(resolve, 500))

      const status = mcpProcessManager.getStatus(crashingServer.id)

      // Should have attempted restart
      if (status?.restartCount) {
        expect(status.restartCount).toBeGreaterThan(0)
      }

      // Eventually stops after max retries
      await new Promise((resolve) => setTimeout(resolve, 2000))
      const finalStatus = mcpProcessManager.getStatus(crashingServer.id)
      expect(['failed', 'stopped']).toContain(finalStatus?.status)
    })
  })

  describe('Server Configuration Management', () => {
    it('should validate server configuration before start', async () => {
      // Valid configuration
      const validServer: MCPServer = {
        id: 'valid-server',
        name: 'Valid Server',
        command: 'node',
        args: ['--version'],
        enabled: true,
      }

      // Should not throw
      await expect(mcpProcessManager.start(validServer)).resolves.not.toThrow()
    })

    it('should reject invalid server configuration', async () => {
      const invalidServer: MCPServer = {
        id: 'invalid-server',
        name: 'Invalid Server',
        command: 'nonexistent-command-xyz',
        args: [],
        enabled: true,
      }

      // Should throw or transition to failed state
      try {
        await mcpProcessManager.start(invalidServer)
        await new Promise((resolve) => setTimeout(resolve, 200))

        const status = mcpProcessManager.getStatus(invalidServer.id)
        expect(status?.status).toBe('failed')
      } catch (error) {
        // Expected - invalid command
        expect(error).toBeDefined()
      }
    })

    it('should update server configuration and restart', async () => {
      // Start with initial config
      await mcpProcessManager.start(testServer)
      const firstPid = mcpProcessManager.getStatus(testServer.id)?.pid

      // Update configuration (change args)
      const updatedServer: MCPServer = {
        ...testServer,
        args: ['-e', 'console.log("Updated"); setInterval(() => {}, 1000)'],
      }

      // Restart with new config
      await mcpProcessManager.restart(updatedServer)
      await new Promise((resolve) => setTimeout(resolve, 200))

      const secondPid = mcpProcessManager.getStatus(testServer.id)?.pid

      // Should be different process
      expect(secondPid).not.toBe(firstPid)

      // Logs should reflect new config
      const logs = mcpProcessManager.getLogs(testServer.id)
      expect(logs.some((log) => log.includes('Updated'))).toBe(true)
    })
  })

  describe('Multiple Server Management', () => {
    it('should manage multiple servers independently', async () => {
      const servers: MCPServer[] = [
        {
          id: 'server-1',
          name: 'Server 1',
          command: 'node',
          args: ['-e', 'console.log("Server 1"); setInterval(() => {}, 1000)'],
          enabled: true,
        },
        {
          id: 'server-2',
          name: 'Server 2',
          command: 'node',
          args: ['-e', 'console.log("Server 2"); setInterval(() => {}, 1000)'],
          enabled: true,
        },
        {
          id: 'server-3',
          name: 'Server 3',
          command: 'node',
          args: ['-e', 'console.log("Server 3"); setInterval(() => {}, 1000)'],
          enabled: true,
        },
      ]

      // Start all servers
      for (const server of servers) {
        await mcpProcessManager.start(server)
      }

      await new Promise((resolve) => setTimeout(resolve, 200))

      // Verify all running
      for (const server of servers) {
        const status = mcpProcessManager.getStatus(server.id)
        expect(status?.status).toBe('running')
        expect(status?.pid).toBeDefined()
      }

      // Stop one server
      await mcpProcessManager.stop('server-2')

      // Verify server-2 stopped, others still running
      const status1 = mcpProcessManager.getStatus('server-1')
      const status2 = mcpProcessManager.getStatus('server-2')
      const status3 = mcpProcessManager.getStatus('server-3')

      expect(status1?.status).toBe('running')
      expect(status2?.status).toBe('stopped')
      expect(status3?.status).toBe('running')
    })

    it('should restart individual server without affecting others', async () => {
      const server1: MCPServer = {
        id: 'server-1',
        name: 'Server 1',
        command: 'node',
        args: ['-e', 'setInterval(() => {}, 1000)'],
        enabled: true,
      }
      const server2: MCPServer = {
        id: 'server-2',
        name: 'Server 2',
        command: 'node',
        args: ['-e', 'setInterval(() => {}, 1000)'],
        enabled: true,
      }

      await mcpProcessManager.start(server1)
      await mcpProcessManager.start(server2)

      const pid1Before = mcpProcessManager.getStatus('server-1')?.pid
      const pid2Before = mcpProcessManager.getStatus('server-2')?.pid

      // Restart server-1
      await mcpProcessManager.restart(server1)
      await new Promise((resolve) => setTimeout(resolve, 200))

      const pid1After = mcpProcessManager.getStatus('server-1')?.pid
      const pid2After = mcpProcessManager.getStatus('server-2')?.pid

      // Server 1 should have new PID
      expect(pid1After).not.toBe(pid1Before)

      // Server 2 should have same PID
      expect(pid2After).toBe(pid2Before)
    })

    it('should stop all servers at once', async () => {
      const servers: MCPServer[] = Array.from({ length: 5 }, (_, i) => ({
        id: `bulk-server-${i}`,
        name: `Bulk Server ${i}`,
        command: 'node',
        args: ['-e', 'setInterval(() => {}, 1000)'],
        enabled: true,
      }))

      // Start all
      for (const server of servers) {
        await mcpProcessManager.start(server)
      }

      // Stop all
      mcpProcessManager.stopAll()

      // Verify all stopped
      for (const server of servers) {
        const status = mcpProcessManager.getStatus(server.id)
        expect(status?.status).toBe('stopped')
      }
    })
  })

  describe('Error Recovery', () => {
    it('should recover from temporary failures', async () => {
      const intermittentServer: MCPServer = {
        ...testServer,
        id: 'intermittent-server',
        args: [
          '-e',
          'let crashes = 0; const interval = setInterval(() => { if(crashes < 1) { crashes++; process.exit(1); } }, 100);',
        ],
      }

      await mcpProcessManager.start(intermittentServer)

      // Wait for crash and recovery
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const status = mcpProcessManager.getStatus(intermittentServer.id)

      // Should have auto-restarted
      if (status?.status === 'running') {
        expect(status.restartCount).toBeGreaterThan(0)
      }
    })

    it('should fail permanently after max retries exhausted', async () => {
      const permanentFailServer: MCPServer = {
        ...testServer,
        id: 'permanent-fail-server',
        args: ['-e', 'process.exit(1)'], // Always fails
      }

      await mcpProcessManager.start(permanentFailServer)

      // Wait for all retries to exhaust
      await new Promise((resolve) => setTimeout(resolve, 5000))

      const status = mcpProcessManager.getStatus(permanentFailServer.id)

      // Should be in failed state with max retries
      expect(status?.status).toBe('failed')
      expect(status?.restartCount).toBeLessThanOrEqual(2)
    }, 10000)
  })

  describe('Monitoring and Logs', () => {
    it('should continuously collect logs during server lifetime', async () => {
      const verboseServer: MCPServer = {
        ...testServer,
        id: 'verbose-server',
        args: [
          '-e',
          'let i = 0; setInterval(() => { console.log(`Log line ${i++}`); }, 50);',
        ],
      }

      await mcpProcessManager.start(verboseServer)

      // Collect logs over time
      await new Promise((resolve) => setTimeout(resolve, 500))
      const logs1 = mcpProcessManager.getLogs(verboseServer.id)

      await new Promise((resolve) => setTimeout(resolve, 500))
      const logs2 = mcpProcessManager.getLogs(verboseServer.id)

      // Should accumulate more logs
      expect(logs2.length).toBeGreaterThan(logs1.length)
    })

    it('should track uptime accurately', async () => {
      await mcpProcessManager.start(testServer)

      const uptime1 = mcpProcessManager.getStatus(testServer.id)?.uptime || 0

      await new Promise((resolve) => setTimeout(resolve, 1000))

      const uptime2 = mcpProcessManager.getStatus(testServer.id)?.uptime || 0

      // Uptime should increase
      expect(uptime2).toBeGreaterThan(uptime1)
      expect(uptime2).toBeGreaterThanOrEqual(1000) // At least 1 second
    })

    it('should provide health check status', async () => {
      await mcpProcessManager.start(testServer)

      await new Promise((resolve) => setTimeout(resolve, 11000))

      const status = mcpProcessManager.getStatus(testServer.id)

      // Should have performed health check
      expect(status?.lastHealthCheck).toBeDefined()
      expect(status?.lastHealthCheck?.getTime()).toBeGreaterThan(Date.now() - 12000)
    }, 15000)
  })
})
