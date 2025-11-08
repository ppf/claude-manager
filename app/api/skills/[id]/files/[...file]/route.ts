import { NextRequest } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import { CLAUDE_PATHS } from '@/lib/claude/paths'
import { successResponse, filesystemError } from '@/lib/api/response'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; file: string[] } }
) {
  try {
    const filename = params.file.join('/')
    const { content } = await request.json()

    const filePath = path.join(CLAUDE_PATHS.SKILLS, params.id, filename)
    await fs.writeFile(filePath, content, 'utf-8')

    return successResponse({ message: 'File saved' })
  } catch {
    return filesystemError('Failed to save file')
  }
}
