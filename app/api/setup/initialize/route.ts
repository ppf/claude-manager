import { initializeEnvironment } from '@/lib/claude/setup-checker'
import { successResponse, errorResponse } from '@/lib/api/response'

export async function POST() {
  try {
    await initializeEnvironment()
    return successResponse({ message: 'Environment initialized successfully' })
  } catch (error) {
    console.error('Error initializing environment:', error)
    return errorResponse(
      {
        type: 'filesystem',
        message: error instanceof Error ? error.message : 'Failed to initialize environment',
        recoverable: true,
      },
      500
    )
  }
}
