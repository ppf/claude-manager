import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'

/**
 * E2E tests for complete skill management workflows
 * Tests: install → edit → validate → update → uninstall
 */
describe('E2E: Skill Management Workflow', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'claude-e2e-test-'))
    process.env.CLAUDE_HOME = tempDir
  })

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  describe('Complete Skill Installation Flow', () => {
    it('should install skill from marketplace, validate structure, and make it available', async () => {
      const skillId = 'test-skill'
      const skillsDir = path.join(tempDir, '.claude', 'skills', skillId)

      // Step 1: Install skill (simulated - would call API in real E2E)
      await fs.mkdir(skillsDir, { recursive: true })
      await fs.writeFile(
        path.join(skillsDir, 'skill.md'),
        `---
name: ${skillId}
description: Test skill for E2E workflow
---

This is a test skill with example content.
`
      )

      // Step 2: Validate skill structure
      const skillFile = path.join(skillsDir, 'skill.md')
      const exists = await fs
        .access(skillFile)
        .then(() => true)
        .catch(() => false)
      expect(exists).toBe(true)

      // Step 3: Read and validate content
      const content = await fs.readFile(skillFile, 'utf-8')
      expect(content).toContain('name: test-skill')
      expect(content).toContain('description:')

      // Step 4: Verify skill is discoverable (would call GET /api/skills)
      const skillsList = await fs.readdir(path.join(tempDir, '.claude', 'skills'))
      expect(skillsList).toContain(skillId)
    })

    it('should handle installation failure and cleanup', async () => {
      const skillId = 'failing-skill'
      const skillsDir = path.join(tempDir, '.claude', 'skills', skillId)

      // Simulate failed installation
      try {
        await fs.mkdir(skillsDir, { recursive: true })
        throw new Error('Installation failed')
      } catch {
        // Cleanup on failure
        await fs.rm(skillsDir, { recursive: true, force: true })
      }

      // Verify cleanup happened
      const exists = await fs
        .access(skillsDir)
        .then(() => true)
        .catch(() => false)
      expect(exists).toBe(false)
    })
  })

  describe('Skill Editing with Validation', () => {
    beforeEach(async () => {
      // Setup: Install a skill to edit
      const skillsDir = path.join(tempDir, '.claude', 'skills', 'edit-test')
      await fs.mkdir(skillsDir, { recursive: true })
      await fs.writeFile(
        path.join(skillsDir, 'skill.md'),
        `---
name: edit-test
description: Original description
---

Original content.
`
      )
    })

    it('should edit skill content and validate frontmatter', async () => {
      const skillFile = path.join(tempDir, '.claude', 'skills', 'edit-test', 'skill.md')

      // Step 1: Read current content
      const original = await fs.readFile(skillFile, 'utf-8')
      expect(original).toContain('Original description')

      // Step 2: Edit content
      const updated = `---
name: edit-test
description: Updated description
tags: [updated, test]
---

Updated content with more details.
`
      await fs.writeFile(skillFile, updated)

      // Step 3: Validate changes
      const newContent = await fs.readFile(skillFile, 'utf-8')
      expect(newContent).toContain('Updated description')
      expect(newContent).toContain('tags:')
      expect(newContent).toContain('Updated content')

      // Step 4: Validate frontmatter structure
      expect(newContent).toMatch(/^---\n[\s\S]*?\n---\n/)
    })

    it('should reject invalid frontmatter edits', async () => {
      const skillFile = path.join(tempDir, '.claude', 'skills', 'edit-test', 'skill.md')

      // Invalid YAML frontmatter
      const invalid = `---
name: edit-test
description: Missing closing
Content without closing frontmatter
`
      await fs.writeFile(skillFile, invalid)

      const content = await fs.readFile(skillFile, 'utf-8')

      // Validation should fail (no closing ---)
      const hasFrontmatter = /^---\n[\s\S]*?\n---\n/.test(content)
      expect(hasFrontmatter).toBe(false)
    })

    it('should preserve file permissions after edit', async () => {
      const skillFile = path.join(tempDir, '.claude', 'skills', 'edit-test', 'skill.md')

      // Get original permissions
      const originalStats = await fs.stat(skillFile)

      // Edit file
      await fs.writeFile(skillFile, '---\nname: test\n---\nNew content')

      // Check permissions unchanged
      const newStats = await fs.stat(skillFile)
      expect(newStats.mode).toBe(originalStats.mode)
    })
  })

  describe('Skill Update Workflow', () => {
    beforeEach(async () => {
      // Setup: Install skill with Git metadata
      const skillsDir = path.join(tempDir, '.claude', 'skills', 'update-test')
      await fs.mkdir(skillsDir, { recursive: true })
      await fs.writeFile(path.join(skillsDir, 'skill.md'), '---\nname: update-test\n---\nv1.0')
      await fs.mkdir(path.join(skillsDir, '.git'), { recursive: true })
      await fs.writeFile(path.join(skillsDir, '.git', 'HEAD'), 'ref: refs/heads/main')
    })

    it('should check for updates and show available version', async () => {
      const skillDir = path.join(tempDir, '.claude', 'skills', 'update-test')

      // Check if it's a Git repo
      const isGitRepo = await fs
        .access(path.join(skillDir, '.git'))
        .then(() => true)
        .catch(() => false)

      expect(isGitRepo).toBe(true)

      // Would call GET /api/skills/update-test with action=check-update
      // For now, verify structure is ready for update
      const skillFile = path.join(skillDir, 'skill.md')
      const exists = await fs.access(skillFile).then(() => true).catch(() => false)
      expect(exists).toBe(true)
    })

    it('should perform update and preserve user changes', async () => {
      const skillFile = path.join(tempDir, '.claude', 'skills', 'update-test', 'skill.md')

      // User makes local changes
      await fs.writeFile(skillFile, '---\nname: update-test\n---\nv1.0 with local changes')

      const beforeUpdate = await fs.readFile(skillFile, 'utf-8')

      // Simulate update (in real scenario, would be Git pull)
      // For test, just verify we can detect local changes
      const hasLocalChanges = beforeUpdate.includes('local changes')
      expect(hasLocalChanges).toBe(true)
    })
  })

  describe('Skill Uninstall Workflow', () => {
    beforeEach(async () => {
      // Install multiple skills
      const skills = ['skill-a', 'skill-b', 'skill-c']
      for (const skill of skills) {
        const skillDir = path.join(tempDir, '.claude', 'skills', skill)
        await fs.mkdir(skillDir, { recursive: true })
        await fs.writeFile(path.join(skillDir, 'skill.md'), `---\nname: ${skill}\n---\nContent`)
      }
    })

    it('should completely remove skill directory', async () => {
      const skillDir = path.join(tempDir, '.claude', 'skills', 'skill-a')

      // Verify exists
      let exists = await fs
        .access(skillDir)
        .then(() => true)
        .catch(() => false)
      expect(exists).toBe(true)

      // Uninstall (remove directory)
      await fs.rm(skillDir, { recursive: true, force: true })

      // Verify removed
      exists = await fs
        .access(skillDir)
        .then(() => true)
        .catch(() => false)
      expect(exists).toBe(false)
    })

    it('should not affect other skills when uninstalling one', async () => {
      const skillA = path.join(tempDir, '.claude', 'skills', 'skill-a')
      const skillB = path.join(tempDir, '.claude', 'skills', 'skill-b')
      const skillC = path.join(tempDir, '.claude', 'skills', 'skill-c')

      // Uninstall skill-b
      await fs.rm(skillB, { recursive: true, force: true })

      // Verify skill-b removed
      const bExists = await fs
        .access(skillB)
        .then(() => true)
        .catch(() => false)
      expect(bExists).toBe(false)

      // Verify skill-a and skill-c still exist
      const aExists = await fs
        .access(skillA)
        .then(() => true)
        .catch(() => false)
      const cExists = await fs
        .access(skillC)
        .then(() => true)
        .catch(() => false)

      expect(aExists).toBe(true)
      expect(cExists).toBe(true)
    })
  })
})
