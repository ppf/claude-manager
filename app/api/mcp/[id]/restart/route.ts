import { NextRequest } from 'next/server'
import { restartServer } from '@/lib/api/mcp-service'
import { successResponse, errorResponse } from '@/lib/api/response'

export const runtime = 'nodejs'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await restartServer(id)

    return successResponse({ message: 'Server restarted successfully' })
  } catch (error) {
    console.error('Error restarting MCP server:', error)
    return errorResponse(
      {
        type: 'unknown',
        message: error instanceof Error ? error.message : 'Failed to restart MCP server',
        recoverable: true,
      },
      500
    )
  }
}
