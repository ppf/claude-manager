import { NextRequest } from 'next/server'
import { getServer, testMCPConnection } from '@/lib/api/mcp-service'
import { successResponse, errorResponse } from '@/lib/api/response'

export const runtime = 'nodejs'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const server = await getServer(id)

    if (!server) {
      return errorResponse(
        {
          type: 'unknown',
          message: `Server '${id}' not found`,
          recoverable: false,
        },
        404
      )
    }

    const success = await testMCPConnection(server)

    return successResponse({
      success,
      message: success ? 'Connection successful' : 'Connection failed',
    })
  } catch (error) {
    console.error('Error testing MCP connection:', error)
    return errorResponse(
      {
        type: 'unknown',
        message: error instanceof Error ? error.message : 'Failed to test connection',
        recoverable: true,
      },
      500
    )
  }
}
