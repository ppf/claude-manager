import { checkEnvironment } from '@/lib/claude/setup-checker'
import { successResponse, errorResponse } from '@/lib/api/response'

export async function GET() {
  try {
    const status = await checkEnvironment()
    return successResponse(status)
  } catch (error) {
    console.error('Error checking environment:', error)
    return errorResponse(
      {
        type: 'unknown',
        message: error instanceof Error ? error.message : 'Failed to check environment',
        recoverable: false,
      },
      500
    )
  }
}
