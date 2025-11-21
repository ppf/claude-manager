import { NextRequest } from 'next/server'
import { startServer } from '@/lib/api/mcp-service'
import { successResponse, errorResponse } from '@/lib/api/response'

export const runtime = 'nodejs'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await startServer(id)

    return successResponse({ message: 'Server started successfully' })
  } catch (error) {
    console.error('Error starting MCP server:', error)
    return errorResponse(
      {
        type: 'unknown',
        message: error instanceof Error ? error.message : 'Failed to start MCP server',
        recoverable: true,
      },
      500
    )
  }
}
