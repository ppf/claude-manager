import { NextRequest } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import { CLAUDE_PATHS } from '@/lib/claude/paths'
import { getTemplate, renderTemplate } from '@/lib/templates/skill-templates'
import { successResponse, validationError, filesystemError } from '@/lib/api/response'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { templateId, name, description, author, category } = body

    if (!templateId || !name || !description) {
      return validationError('Missing required fields')
    }

    const template = getTemplate(templateId)
    if (!template) {
      return validationError('Invalid template ID')
    }

    // Generate skill ID from name (slug)
    const skillId = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    const skillPath = path.join(CLAUDE_PATHS.SKILLS, skillId)

    // Check if skill already exists (slug collision detection)
    try {
      await fs.access(skillPath)
      return validationError(
        `A skill with this name already exists (ID: ${skillId}). ` +
          'Please choose a different name or manually rename the existing skill directory.'
      )
    } catch {
      // Skill doesn't exist, continue
    }

    // Render template with variables
    const rendered = renderTemplate(template, {
      NAME: name,
      DESCRIPTION: description,
      AUTHOR: author || 'Unknown',
      CATEGORY: category || 'other',
    })

    // Create skill directory
    await fs.mkdir(skillPath, { recursive: true })

    // Create all files
    for (const [filename, content] of Object.entries(rendered.files)) {
      const filePath = path.join(skillPath, filename)
      const fileDir = path.dirname(filePath)

      // Create subdirectories if needed
      await fs.mkdir(fileDir, { recursive: true })

      // Write file
      await fs.writeFile(filePath, content, 'utf-8')
    }

    return successResponse({
      id: skillId,
      name,
      path: skillPath,
      message: 'Skill created successfully',
    })
  } catch (error) {
    console.error('Error creating skill:', error)
    return filesystemError(error instanceof Error ? error.message : 'Failed to create skill')
  }
}
