import { NextRequest } from 'next/server'
import { stopServer } from '@/lib/api/mcp-service'
import { successResponse, errorResponse } from '@/lib/api/response'

export const runtime = 'nodejs'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await stopServer(id)

    return successResponse({ message: 'Server stopped successfully' })
  } catch (error) {
    console.error('Error stopping MCP server:', error)
    return errorResponse(
      {
        type: 'unknown',
        message: error instanceof Error ? error.message : 'Failed to stop MCP server',
        recoverable: true,
      },
      500
    )
  }
}
