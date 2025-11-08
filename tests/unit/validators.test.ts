import { describe, it, expect } from 'vitest'
import { skillSchema } from '@/lib/validators/skill-schema'

describe('Skill schema validation', () => {
  it('should validate correct skill data', () => {
    const validSkill = {
      name: 'Test Skill',
      description: 'A test skill',
      author: 'Test Author',
      version: '1.0.0',
      path: '/path/to/skill',
    }

    const result = skillSchema.safeParse(validSkill)
    expect(result.success).toBe(true)
  })

  it('should reject skill without required name', () => {
    const invalidSkill = {
      description: 'A test skill',
      author: 'Test Author',
      version: '1.0.0',
    }

    const result = skillSchema.safeParse(invalidSkill)
    expect(result.success).toBe(false)
  })

  it('should allow optional fields', () => {
    const minimalSkill = {
      name: 'Test Skill',
      description: '',
      author: '',
      version: '',
      path: '',
    }

    const result = skillSchema.safeParse(minimalSkill)
    expect(result.success).toBe(true)
  })

  it('should validate version format', () => {
    const skillWithVersion = {
      name: 'Test Skill',
      description: 'A test skill',
      author: 'Test Author',
      version: '1.0.0',
      path: '',
    }

    const result = skillSchema.safeParse(skillWithVersion)
    expect(result.success).toBe(true)
  })
})

