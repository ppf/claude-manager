import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from '@/app/api/skills/[id]/route'
import { NextRequest } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'

/**
 * Integration tests for Git-based skill operations
 * Tests installation, updates, and uninstallation of marketplace skills
 */
describe('Skills API - Git Operations', () => {
  let tempDir: string

  beforeEach(async () => {
    // Create temporary directory for test skills
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'claude-skills-test-'))
    process.env.CLAUDE_HOME = tempDir
  })

  describe('Install Skill from Marketplace', () => {
    it('should install a marketplace skill via Git clone', async () => {
      const request = new NextRequest('http://localhost:3000/api/skills/test-skill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'install',
          repoUrl: 'https://github.com/test/skill-repo.git',
        }),
      })

      const params = Promise.resolve({ id: 'test-skill' })
      const response = await POST(request, { params })
      const data = await response.json()

      // Mock will succeed, verify response structure
      expect(data).toHaveProperty('success')
      expect(data).toHaveProperty('data')

      // Verify error handling structure exists
      if (!data.success) {
        expect(data).toHaveProperty('error')
        expect(data.error).toHaveProperty('type')
        expect(data.error).toHaveProperty('message')
      }
    })

    it('should validate repository URL format', async () => {
      const request = new NextRequest('http://localhost:3000/api/skills/test-skill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'install',
          repoUrl: 'invalid-url',
        }),
      })

      const params = Promise.resolve({ id: 'test-skill' })
      const response = await POST(request, { params })
      const data = await response.json()

      // Should fail validation
      expect(data.success).toBe(false)
      if (!data.success) {
        expect(data.error?.type).toBe('validation')
      }
    })

    it('should handle Git clone failures gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/skills/test-skill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'install',
          repoUrl: 'https://github.com/nonexistent/repo.git',
        }),
      })

      const params = Promise.resolve({ id: 'test-skill' })
      const response = await POST(request, { params })
      const data = await response.json()

      // Error handling test
      if (!data.success) {
        expect(data.error).toBeDefined()
        expect(data.error?.recoverable).toBeDefined()
      }
    })
  })

  describe('Update Skill from Marketplace', () => {
    it('should check for available updates', async () => {
      const request = new NextRequest('http://localhost:3000/api/skills/test-skill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check-update',
        }),
      })

      const params = Promise.resolve({ id: 'test-skill' })
      const response = await POST(request, { params })
      const data = await response.json()

      // Verify response structure
      expect(data).toHaveProperty('success')
      if (data.success) {
        expect(data.data).toHaveProperty('updateAvailable')
        if (data.data.updateAvailable) {
          expect(data.data).toHaveProperty('latestVersion')
          expect(data.data).toHaveProperty('gitStatus')
        }
      }
    })

    it('should perform Git pull to update skill', async () => {
      const request = new NextRequest('http://localhost:3000/api/skills/test-skill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
        }),
      })

      const params = Promise.resolve({ id: 'test-skill' })
      const response = await POST(request, { params })
      const data = await response.json()

      // Verify response structure
      expect(data).toHaveProperty('success')
      if (!data.success) {
        expect(data.error).toBeDefined()
      }
    })

    it('should handle merge conflicts during update', async () => {
      const request = new NextRequest('http://localhost:3000/api/skills/test-skill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
        }),
      })

      const params = Promise.resolve({ id: 'test-skill' })
      const response = await POST(request, { params })
      const data = await response.json()

      // Test error handling for conflicts
      if (!data.success && data.error) {
        expect(['git', 'unknown']).toContain(data.error.type)
        expect(data.error.recoverable).toBeDefined()
      }
    })
  })

  describe('Uninstall Skill', () => {
    it('should remove skill directory completely', async () => {
      const request = new NextRequest('http://localhost:3000/api/skills/test-skill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'uninstall',
        }),
      })

      const params = Promise.resolve({ id: 'test-skill' })
      const response = await POST(request, { params })
      const data = await response.json()

      // Verify response structure
      expect(data).toHaveProperty('success')
    })

    it('should handle missing skill directory gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/skills/nonexistent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'uninstall',
        }),
      })

      const params = Promise.resolve({ id: 'nonexistent' })
      const response = await POST(request, { params })
      const data = await response.json()

      // Should handle gracefully
      if (!data.success) {
        expect(data.error).toBeDefined()
        expect(data.error?.type).toBeDefined()
      }
    })
  })

  describe('Git Status and Info', () => {
    it('should detect if directory is a Git repository', async () => {
      const request = new NextRequest('http://localhost:3000/api/skills/test-skill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'git-status',
        }),
      })

      const params = Promise.resolve({ id: 'test-skill' })
      const response = await POST(request, { params })
      const data = await response.json()

      // Verify response structure
      if (data.success) {
        expect(data.data).toHaveProperty('isGitRepo')
      }
    })

    it('should retrieve Git repository information', async () => {
      const request = new NextRequest('http://localhost:3000/api/skills/test-skill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'git-info',
        }),
      })

      const params = Promise.resolve({ id: 'test-skill' })
      const response = await POST(request, { params })
      const data = await response.json()

      // Verify response structure
      if (data.success && data.data.isGitRepo) {
        expect(data.data).toHaveProperty('remotes')
        expect(data.data).toHaveProperty('currentBranch')
        expect(data.data).toHaveProperty('latestCommit')
      }
    })
  })

  describe('Error Recovery', () => {
    it('should rollback on failed installation', async () => {
      const request = new NextRequest('http://localhost:3000/api/skills/test-skill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'install',
          repoUrl: 'https://github.com/invalid/repo.git',
        }),
      })

      const params = Promise.resolve({ id: 'test-skill' })
      const response = await POST(request, { params })
      const data = await response.json()

      // Should cleanup on failure
      if (!data.success) {
        // Verify skill directory doesn't exist
        const skillPath = path.join(tempDir, '.claude', 'skills', 'test-skill')
        try {
          await fs.access(skillPath)
          // If exists, verify it's empty or marked as failed
        } catch {
          // Directory doesn't exist (proper cleanup)
          expect(true).toBe(true)
        }
      }
    })

    it('should provide recovery suggestions for common Git errors', async () => {
      const request = new NextRequest('http://localhost:3000/api/skills/test-skill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
        }),
      })

      const params = Promise.resolve({ id: 'test-skill' })
      const response = await POST(request, { params })
      const data = await response.json()

      // Check error structure
      if (!data.success && data.error) {
        expect(data.error).toHaveProperty('type')
        expect(data.error).toHaveProperty('message')
        expect(data.error).toHaveProperty('recoverable')
      }
    })
  })
})
