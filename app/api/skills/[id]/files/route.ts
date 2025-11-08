import { NextRequest } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import { CLAUDE_PATHS } from '@/lib/claude/paths'
import { successResponse, filesystemError } from '@/lib/api/response'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const skillPath = path.join(CLAUDE_PATHS.SKILLS, params.id)
    const entries = await fs.readdir(skillPath, { withFileTypes: true })

    const files: string[] = []
    const contents: Record<string, string> = {}

    for (const entry of entries) {
      if (entry.isFile()) {
        files.push(entry.name)
        const content = await fs.readFile(
          path.join(skillPath, entry.name),
          'utf-8'
        )
        contents[entry.name] = content
      }
    }

    return successResponse({ files, contents })
  } catch {
    return filesystemError('Failed to read skill files')
  }
}
