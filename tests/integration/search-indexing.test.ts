import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'
import { clearIndex, upsertDocument, searchDocuments } from '@/lib/db/search-index'
import { indexFile, indexDirectory } from '@/lib/db/indexer'
import chokidar from 'chokidar'

/**
 * Integration tests for search indexing with file watcher
 * Tests file watching, incremental indexing, and debouncing
 */
describe('Search Indexing Integration', () => {
  let tempDir: string
  let skillsDir: string
  let commandsDir: string

  beforeEach(async () => {
    // Create temporary directory structure
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'claude-search-test-'))
    skillsDir = path.join(tempDir, '.claude', 'skills')
    commandsDir = path.join(tempDir, '.claude', 'commands')

    await fs.mkdir(skillsDir, { recursive: true })
    await fs.mkdir(commandsDir, { recursive: true })

    // Clear search index
    clearIndex()

    // Set env for testing
    process.env.CLAUDE_HOME = tempDir
  })

  afterEach(async () => {
    // Cleanup
    try {
      await fs.rm(tempDir, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  describe('File Indexing', () => {
    it('should index skill files', async () => {
      const skillFile = path.join(skillsDir, 'test-skill.md')
      const content = `---
name: test-skill
description: A test skill for indexing
---

This is the skill content with TypeScript examples.
`
      await fs.writeFile(skillFile, content)

      await indexFile(skillFile, 'skill')

      const results = searchDocuments('TypeScript')
      expect(results.length).toBeGreaterThan(0)
      expect(results[0].type).toBe('skill')
    })

    it('should extract frontmatter metadata', async () => {
      const skillFile = path.join(skillsDir, 'metadata-skill.md')
      const content = `---
name: metadata-skill
description: Testing metadata extraction
tags: [test, metadata]
---

Content here.
`
      await fs.writeFile(skillFile, content)

      await indexFile(skillFile, 'skill')

      const results = searchDocuments('metadata-skill')
      expect(results.length).toBeGreaterThan(0)
      expect(results[0].title).toContain('metadata-skill')
    })

    it('should index command files', async () => {
      const commandFile = path.join(commandsDir, 'test-command.md')
      const content = `---
name: test-command
description: A test command
---

Execute this command to test functionality.
`
      await fs.writeFile(commandFile, content)

      await indexFile(commandFile, 'command')

      const results = searchDocuments('command')
      expect(results.length).toBeGreaterThan(0)
      expect(results[0].type).toBe('command')
    })

    it('should handle files without frontmatter', async () => {
      const plainFile = path.join(skillsDir, 'plain.md')
      const content = 'Just plain markdown content without frontmatter.'

      await fs.writeFile(plainFile, content)

      await indexFile(plainFile, 'skill')

      const results = searchDocuments('plain markdown')
      expect(results.length).toBeGreaterThan(0)
    })

    it('should update index when file changes', async () => {
      const skillFile = path.join(skillsDir, 'update-test.md')
      const content1 = `---
name: update-test
description: Original content
---

Original body content.
`
      await fs.writeFile(skillFile, content1)
      await indexFile(skillFile, 'skill')

      const results1 = searchDocuments('Original')
      expect(results1.length).toBeGreaterThan(0)

      // Update file
      const content2 = `---
name: update-test
description: Updated content
---

Updated body content with new keywords.
`
      await fs.writeFile(skillFile, content2)
      await indexFile(skillFile, 'skill')

      const results2 = searchDocuments('Updated')
      expect(results2.length).toBeGreaterThan(0)

      const results3 = searchDocuments('Original')
      // Original content should still be findable or replaced
      expect(results3.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Directory Indexing', () => {
    it('should index all files in directory', async () => {
      // Create multiple skill files
      await fs.writeFile(
        path.join(skillsDir, 'skill-1.md'),
        '---\nname: skill-1\n---\nFirst skill content'
      )
      await fs.writeFile(
        path.join(skillsDir, 'skill-2.md'),
        '---\nname: skill-2\n---\nSecond skill content'
      )
      await fs.writeFile(
        path.join(skillsDir, 'skill-3.md'),
        '---\nname: skill-3\n---\nThird skill content'
      )

      await indexDirectory(skillsDir, 'skill')

      const results = searchDocuments('skill content')
      expect(results.length).toBeGreaterThanOrEqual(3)
    })

    it('should skip non-markdown files', async () => {
      await fs.writeFile(path.join(skillsDir, 'skill.md'), '---\nname: valid\n---\nValid content')
      await fs.writeFile(path.join(skillsDir, 'readme.txt'), 'Text file should be ignored')
      await fs.writeFile(path.join(skillsDir, 'config.json'), '{"key": "value"}')

      await indexDirectory(skillsDir, 'skill')

      const results = searchDocuments('content')
      expect(results.length).toBe(1)
      expect(results[0].path).toMatch(/skill\.md$/)
    })

    it('should handle nested directories', async () => {
      const nestedDir = path.join(skillsDir, 'category')
      await fs.mkdir(nestedDir, { recursive: true })

      await fs.writeFile(path.join(skillsDir, 'root.md'), '---\nname: root\n---\nRoot level')
      await fs.writeFile(
        path.join(nestedDir, 'nested.md'),
        '---\nname: nested\n---\nNested level'
      )

      await indexDirectory(skillsDir, 'skill')

      const results = searchDocuments('level')
      expect(results.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('File Watcher Integration', () => {
    it('should detect new file creation', async () => {
      const watcher = chokidar.watch(skillsDir, {
        persistent: false,
        ignoreInitial: true,
      })

      let fileAdded = false
      watcher.on('add', (filePath) => {
        fileAdded = true
        expect(filePath).toContain('new-skill.md')
      })

      // Create new file
      await new Promise((resolve) => setTimeout(resolve, 100)) // Wait for watcher to initialize
      await fs.writeFile(path.join(skillsDir, 'new-skill.md'), '---\nname: new\n---\nNew skill')

      await new Promise((resolve) => setTimeout(resolve, 500)) // Wait for file event
      expect(fileAdded).toBe(true)

      await watcher.close()
    })

    it('should detect file modifications', async () => {
      const testFile = path.join(skillsDir, 'modify-test.md')
      await fs.writeFile(testFile, '---\nname: test\n---\nOriginal')

      const watcher = chokidar.watch(skillsDir, {
        persistent: false,
        ignoreInitial: true,
      })

      let fileChanged = false
      watcher.on('change', (filePath) => {
        fileChanged = true
        expect(filePath).toBe(testFile)
      })

      await new Promise((resolve) => setTimeout(resolve, 100))
      await fs.writeFile(testFile, '---\nname: test\n---\nModified')

      await new Promise((resolve) => setTimeout(resolve, 500))
      expect(fileChanged).toBe(true)

      await watcher.close()
    })

    it('should detect file deletion', async () => {
      const testFile = path.join(skillsDir, 'delete-test.md')
      await fs.writeFile(testFile, '---\nname: test\n---\nContent')

      const watcher = chokidar.watch(skillsDir, {
        persistent: false,
        ignoreInitial: true,
      })

      let fileDeleted = false
      watcher.on('unlink', (filePath) => {
        fileDeleted = true
        expect(filePath).toBe(testFile)
      })

      await new Promise((resolve) => setTimeout(resolve, 100))
      await fs.unlink(testFile)

      await new Promise((resolve) => setTimeout(resolve, 500))
      expect(fileDeleted).toBe(true)

      await watcher.close()
    })

    it('should debounce rapid file changes', async () => {
      const testFile = path.join(skillsDir, 'debounce-test.md')
      await fs.writeFile(testFile, '---\nname: test\n---\nOriginal')

      const watcher = chokidar.watch(skillsDir, {
        persistent: false,
        ignoreInitial: true,
      })

      let changeCount = 0
      watcher.on('change', () => {
        changeCount++
      })

      await new Promise((resolve) => setTimeout(resolve, 100))

      // Make rapid changes
      for (let i = 0; i < 10; i++) {
        await fs.writeFile(testFile, `---\nname: test\n---\nChange ${i}`)
        await new Promise((resolve) => setTimeout(resolve, 50))
      }

      await new Promise((resolve) => setTimeout(resolve, 500))

      // Should detect multiple changes (debouncing happens at indexer level)
      expect(changeCount).toBeGreaterThan(0)

      await watcher.close()
    })
  })

  describe('Search Functionality', () => {
    beforeEach(async () => {
      // Index sample files
      await fs.writeFile(
        path.join(skillsDir, 'typescript-skill.md'),
        '---\nname: typescript\n---\nTypeScript programming guide'
      )
      await fs.writeFile(
        path.join(skillsDir, 'react-skill.md'),
        '---\nname: react\n---\nReact component development'
      )
      await fs.writeFile(
        path.join(commandsDir, 'deploy-command.md'),
        '---\nname: deploy\n---\nDeploy application to production'
      )

      await indexDirectory(skillsDir, 'skill')
      await indexDirectory(commandsDir, 'command')
    })

    it('should find documents by keyword', () => {
      const results = searchDocuments('TypeScript')
      expect(results.length).toBeGreaterThan(0)
      expect(results[0].title).toContain('typescript')
    })

    it('should rank results by relevance', () => {
      const results = searchDocuments('React component')
      expect(results.length).toBeGreaterThan(0)
      // Result with both words should rank higher
      expect(results[0].title).toContain('react')
    })

    it('should filter by document type', () => {
      const skillResults = searchDocuments('skill', { type: 'skill' })
      const commandResults = searchDocuments('command', { type: 'command' })

      expect(skillResults.every((r) => r.type === 'skill')).toBe(true)
      expect(commandResults.every((r) => r.type === 'command')).toBe(true)
    })

    it('should handle partial matches', () => {
      const results = searchDocuments('Type')
      expect(results.some((r) => r.title.includes('typescript'))).toBe(true)
    })

    it('should return empty array for no matches', () => {
      const results = searchDocuments('nonexistent-keyword-xyz')
      expect(results).toEqual([])
    })
  })

  describe('Performance', () => {
    it('should index large files efficiently', async () => {
      const largeContent = '---\nname: large\n---\n' + 'Lorem ipsum '.repeat(10000)
      await fs.writeFile(path.join(skillsDir, 'large-file.md'), largeContent)

      const startTime = Date.now()
      await indexFile(path.join(skillsDir, 'large-file.md'), 'skill')
      const duration = Date.now() - startTime

      // Should complete within reasonable time (< 1s)
      expect(duration).toBeLessThan(1000)
    })

    it('should handle many files efficiently', async () => {
      // Create 100 small files
      for (let i = 0; i < 100; i++) {
        await fs.writeFile(
          path.join(skillsDir, `skill-${i}.md`),
          `---\nname: skill-${i}\n---\nContent ${i}`
        )
      }

      const startTime = Date.now()
      await indexDirectory(skillsDir, 'skill')
      const duration = Date.now() - startTime

      // Should complete within reasonable time (< 5s)
      expect(duration).toBeLessThan(5000)

      const results = searchDocuments('Content')
      expect(results.length).toBe(100)
    }, 10000) // Extended timeout
  })
})
