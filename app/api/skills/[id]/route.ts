import { NextRequest } from 'next/server'
import { installSkill, uninstallSkill, toggleSkill } from '@/lib/api/skills-service'
import { successResponse, errorResponse } from '@/lib/api/response'
import { GitAuthError } from '@/lib/git/git-manager'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { action, gitUrl, enabled } = await request.json()

    if (action === 'install') {
      await installSkill(params.id, gitUrl)
      return successResponse({ message: 'Skill installed successfully' })
    }

    if (action === 'toggle') {
      await toggleSkill(params.id, enabled)
      return successResponse({ message: 'Skill updated successfully' })
    }

    return errorResponse(
      {
        type: 'validation',
        message: 'Invalid action',
        recoverable: true,
      },
      400
    )
  } catch (error) {
    console.error('Error managing skill:', error)

    if (error instanceof GitAuthError) {
      return errorResponse({
        type: 'git',
        message: error.message,
        recoverable: true,
      })
    }

    return errorResponse({
      type: 'unknown',
      message: error instanceof Error ? error.message : 'Operation failed',
      recoverable: true,
    })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await uninstallSkill(params.id)
    return successResponse({ message: 'Skill uninstalled successfully' })
  } catch (error) {
    console.error('Error uninstalling skill:', error)
    return errorResponse({
      type: 'filesystem',
      message: 'Failed to uninstall skill',
      recoverable: false,
    })
  }
}
