import { describe, it, expect, beforeEach } from 'vitest'
import { sanitizePath, getRelativePath, CLAUDE_HOME } from '@/lib/claude/paths'

describe('Path utilities', () => {
  describe('sanitizePath', () => {
    it('should prevent path traversal with ../', () => {
      expect(() => sanitizePath('../../../etc/passwd')).toThrow()
    })

    it('should prevent path traversal with absolute paths outside CLAUDE_HOME', () => {
      expect(() => sanitizePath('/etc/passwd')).toThrow()
    })

    it('should allow valid relative paths', () => {
      expect(sanitizePath('CLAUDE.md')).toBeTruthy()
      expect(sanitizePath('skills/test-skill/SKILL.md')).toBeTruthy()
    })

    it('should allow paths within CLAUDE_HOME', () => {
      const result = sanitizePath('CLAUDE.md')
      expect(result).toContain('CLAUDE.md')
      expect(result).toContain(CLAUDE_HOME)
    })

    it('should normalize paths', () => {
      const result = sanitizePath('./CLAUDE.md')
      expect(result).toBeTruthy()
      expect(result).not.toContain('./')
    })
  })

  describe('getRelativePath', () => {
    it('should get relative path from CLAUDE_HOME', () => {
      const absolutePath = `${CLAUDE_HOME}/CLAUDE.md`
      const relative = getRelativePath(absolutePath)
      expect(relative).toBe('CLAUDE.md')
    })

    it('should handle nested paths', () => {
      const absolutePath = `${CLAUDE_HOME}/skills/test-skill/SKILL.md`
      const relative = getRelativePath(absolutePath)
      expect(relative).toBe('skills/test-skill/SKILL.md')
    })

    it('should handle paths without CLAUDE_HOME prefix', () => {
      const relative = getRelativePath('CLAUDE.md')
      expect(relative).toBe('CLAUDE.md')
    })
  })
})

