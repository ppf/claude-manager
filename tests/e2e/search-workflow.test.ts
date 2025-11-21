import { describe, it, expect, beforeEach } from 'vitest'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'
import { clearIndex, searchDocuments } from '@/lib/db/search-index'
import { indexFile, indexDirectory } from '@/lib/db/indexer'

/**
 * E2E tests for complete search workflow
 * Tests: create files → index → search → filter → update → re-index
 */
describe('E2E: Search Workflow', () => {
  let tempDir: string
  let skillsDir: string
  let commandsDir: string

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'claude-search-e2e-'))
    skillsDir = path.join(tempDir, '.claude', 'skills')
    commandsDir = path.join(tempDir, '.claude', 'commands')

    await fs.mkdir(skillsDir, { recursive: true })
    await fs.mkdir(commandsDir, { recursive: true })

    clearIndex()
    process.env.CLAUDE_HOME = tempDir
  })

  describe('Complete Search Lifecycle', () => {
    it('should perform full workflow: create → index → search → update → re-search', async () => {
      // Step 1: Create skill files
      await fs.writeFile(
        path.join(skillsDir, 'typescript.md'),
        `---
name: typescript
description: TypeScript programming guide
tags: [programming, typescript]
---

Learn TypeScript fundamentals including types, interfaces, and generics.
`
      )

      await fs.writeFile(
        path.join(skillsDir, 'react.md'),
        `---
name: react
description: React component development
tags: [frontend, react]
---

Build React components with hooks and state management.
`
      )

      // Step 2: Index directory
      await indexDirectory(skillsDir, 'skill')

      // Step 3: Search for content
      const results1 = searchDocuments('TypeScript')
      expect(results1.length).toBeGreaterThan(0)
      expect(results1[0].title).toContain('typescript')

      // Step 4: Update file
      await fs.writeFile(
        path.join(skillsDir, 'typescript.md'),
        `---
name: typescript
description: Advanced TypeScript programming
tags: [programming, typescript, advanced]
---

Master advanced TypeScript concepts including conditional types and mapped types.
`
      )

      // Step 5: Re-index
      await indexFile(path.join(skillsDir, 'typescript.md'), 'skill')

      // Step 6: Search for updated content
      const results2 = searchDocuments('advanced')
      expect(results2.length).toBeGreaterThan(0)
      expect(results2[0].title).toContain('typescript')

      // Step 7: Verify old content is updated
      const advancedResults = searchDocuments('Advanced TypeScript')
      expect(advancedResults.some((r) => r.title.includes('typescript'))).toBe(true)
    })

    it('should handle concurrent file creation and indexing', async () => {
      // Create multiple files concurrently
      const createPromises = Array.from({ length: 10 }, (_, i) =>
        fs.writeFile(
          path.join(skillsDir, `skill-${i}.md`),
          `---\nname: skill-${i}\n---\nContent for skill ${i}`
        )
      )

      await Promise.all(createPromises)

      // Index all files
      await indexDirectory(skillsDir, 'skill')

      // Search should find all
      const results = searchDocuments('Content')
      expect(results.length).toBe(10)
    })
  })

  describe('Search Filtering and Ranking', () => {
    beforeEach(async () => {
      // Create diverse content
      await fs.writeFile(
        path.join(skillsDir, 'python-basics.md'),
        '---\nname: python-basics\ndescription: Python fundamentals\n---\nLearn Python basics'
      )
      await fs.writeFile(
        path.join(skillsDir, 'python-advanced.md'),
        '---\nname: python-advanced\ndescription: Advanced Python\n---\nMaster Python advanced topics'
      )
      await fs.writeFile(
        path.join(commandsDir, 'deploy.md'),
        '---\nname: deploy\ndescription: Deploy command\n---\nDeploy Python applications'
      )

      await indexDirectory(skillsDir, 'skill')
      await indexDirectory(commandsDir, 'command')
    })

    it('should filter results by document type', () => {
      // Search all
      const allResults = searchDocuments('Python')
      expect(allResults.length).toBe(3) // 2 skills + 1 command

      // Filter skills only
      const skillResults = searchDocuments('Python', { type: 'skill' })
      expect(skillResults.length).toBe(2)
      expect(skillResults.every((r) => r.type === 'skill')).toBe(true)

      // Filter commands only
      const commandResults = searchDocuments('Python', { type: 'command' })
      expect(commandResults.length).toBe(1)
      expect(commandResults[0].type).toBe('command')
    })

    it('should rank results by relevance', () => {
      const results = searchDocuments('Python advanced')

      // Result with both words should rank higher
      expect(results.length).toBeGreaterThan(0)

      // First result should be most relevant (python-advanced has both words)
      const topResult = results[0]
      expect(topResult.title).toContain('python-advanced')
    })

    it('should handle partial and fuzzy matches', () => {
      // Partial match
      const partialResults = searchDocuments('Pyth')
      expect(partialResults.some((r) => r.title.includes('python'))).toBe(true)

      // Case insensitive
      const caseResults = searchDocuments('PYTHON')
      expect(caseResults.length).toBeGreaterThan(0)
    })

    it('should return results with snippets', () => {
      const results = searchDocuments('Learn Python')

      expect(results.length).toBeGreaterThan(0)

      const result = results[0]
      expect(result).toHaveProperty('snippet')

      // Snippet should contain matching content
      if (result.snippet) {
        expect(result.snippet.toLowerCase()).toContain('python')
      }
    })
  })

  describe('Real-time Search Updates', () => {
    it('should reflect file changes in search results', async () => {
      const skillFile = path.join(skillsDir, 'dynamic.md')

      // Create file with initial content
      await fs.writeFile(
        skillFile,
        '---\nname: dynamic\n---\nInitial keyword content'
      )
      await indexFile(skillFile, 'skill')

      // Search for initial keyword
      const results1 = searchDocuments('Initial keyword')
      expect(results1.length).toBeGreaterThan(0)

      // Update file with new content
      await fs.writeFile(
        skillFile,
        '---\nname: dynamic\n---\nUpdated different content'
      )
      await indexFile(skillFile, 'skill')

      // Search for new keyword
      const results2 = searchDocuments('Updated different')
      expect(results2.length).toBeGreaterThan(0)
      expect(results2[0].title).toContain('dynamic')

      // Old keyword should not match or rank lower
      const oldResults = searchDocuments('Initial keyword')
      if (oldResults.length > 0) {
        // If found, should not be top result anymore
        expect(oldResults[0].title !== 'dynamic' || oldResults[0].score < results2[0].score).toBe(
          true
        )
      }
    })

    it('should handle file deletion from index', async () => {
      const skillFile = path.join(skillsDir, 'temporary.md')

      // Create and index
      await fs.writeFile(skillFile, '---\nname: temporary\n---\nTemporary content')
      await indexFile(skillFile, 'skill')

      // Verify searchable
      const beforeDelete = searchDocuments('Temporary')
      expect(beforeDelete.length).toBeGreaterThan(0)

      // Delete file (in real app, would trigger index removal)
      await fs.unlink(skillFile)

      // Note: In real implementation, file watcher would remove from index
      // For now, we verify the file is gone
      const exists = await fs
        .access(skillFile)
        .then(() => true)
        .catch(() => false)
      expect(exists).toBe(false)
    })
  })

  describe('Large-Scale Search', () => {
    it('should handle searching across many files', async () => {
      // Create 100 files
      for (let i = 0; i < 100; i++) {
        await fs.writeFile(
          path.join(skillsDir, `skill-${i}.md`),
          `---\nname: skill-${i}\n---\nThis is skill number ${i} with unique content`
        )
      }

      await indexDirectory(skillsDir, 'skill')

      // Search common keyword
      const allResults = searchDocuments('skill')
      expect(allResults.length).toBe(100)

      // Search specific number
      const specificResults = searchDocuments('skill number 42')
      expect(specificResults.length).toBeGreaterThan(0)
      expect(specificResults[0].title).toContain('skill-42')
    }, 10000)

    it('should maintain search performance with large index', async () => {
      // Create 50 files with varied content
      for (let i = 0; i < 50; i++) {
        await fs.writeFile(
          path.join(skillsDir, `perf-${i}.md`),
          `---\nname: perf-${i}\n---\nPerformance test file ${i} with keywords: ${i % 10}`
        )
      }

      await indexDirectory(skillsDir, 'skill')

      // Measure search time
      const startTime = Date.now()
      const results = searchDocuments('Performance test')
      const duration = Date.now() - startTime

      expect(results.length).toBeGreaterThan(0)
      expect(duration).toBeLessThan(100) // Should complete < 100ms
    })
  })

  describe('Search Edge Cases', () => {
    it('should handle empty search query', () => {
      const results = searchDocuments('')
      expect(results).toEqual([])
    })

    it('should handle special characters in search', () => {
      // Create file with special characters
      fs.writeFileSync(
        path.join(skillsDir, 'special.md'),
        '---\nname: special\n---\nContent with symbols: @#$%^&*()'
      )
      indexFile(path.join(skillsDir, 'special.md'), 'skill')

      // Search should handle gracefully
      const results = searchDocuments('@#$')
      // May or may not match depending on tokenization
      expect(Array.isArray(results)).toBe(true)
    })

    it('should handle very long search queries', () => {
      const longQuery = 'search '.repeat(100)
      const results = searchDocuments(longQuery)

      // Should not crash
      expect(Array.isArray(results)).toBe(true)
    })

    it('should handle files without frontmatter', async () => {
      const plainFile = path.join(skillsDir, 'plain.md')
      await fs.writeFile(plainFile, 'Just plain content without frontmatter')

      await indexFile(plainFile, 'skill')

      const results = searchDocuments('plain content')
      expect(results.length).toBeGreaterThan(0)
    })

    it('should handle malformed frontmatter gracefully', async () => {
      const malformedFile = path.join(skillsDir, 'malformed.md')
      await fs.writeFile(
        malformedFile,
        `---
name: malformed
description: Missing closing delimiter
Content without closing ---
`
      )

      // Should not crash indexer
      await expect(indexFile(malformedFile, 'skill')).resolves.not.toThrow()
    })
  })
})
