import { z } from 'zod'
import matter from 'gray-matter'

export const skillMetadataSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  version: z
    .string()
    .regex(/^\d+\.\d+\.\d+$/, 'Invalid version format (use semver)')
    .optional(),
  author: z.string().optional(),
  tags: z.array(z.string()).default([]),
  enabled: z.boolean().default(true),
  category: z
    .enum(['productivity', 'development', 'writing', 'research', 'other'])
    .default('other'),
  dependencies: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  homepage: z.string().url('Invalid URL').optional(),
  repository: z.string().url('Invalid repository URL').optional(),
  license: z.string().default('MIT'),
})

export type SkillMetadata = z.infer<typeof skillMetadataSchema>

export const skillFileSchema = z.object({
  metadata: skillMetadataSchema,
  content: z.string().min(1, 'Skill content cannot be empty'),
})

export function validateSkillFile(content: string): {
  valid: boolean
  metadata?: SkillMetadata
  errors?: Array<{ field: string; message: string }>
} {
  try {
    const { data, content: skillContent } = matter(content)

    const result = skillMetadataSchema.safeParse(data)

    if (!result.success) {
      return {
        valid: false,
        errors: result.error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      }
    }

    if (skillContent.trim().length === 0) {
      return {
        valid: false,
        errors: [{ field: 'content', message: 'Skill content cannot be empty' }],
      }
    }

    return {
      valid: true,
      metadata: result.data,
    }
  } catch {
    return {
      valid: false,
      errors: [{ field: 'parse', message: 'Failed to parse skill file' }],
    }
  }
}
