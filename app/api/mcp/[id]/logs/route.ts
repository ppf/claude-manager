import { NextRequest } from 'next/server'
import { getServerLogs } from '@/lib/api/mcp-service'
import { successResponse, errorResponse } from '@/lib/api/response'

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const logs = await getServerLogs(id)

    return successResponse({ logs })
  } catch (error) {
    console.error('Error fetching server logs:', error)
    return errorResponse({
      type: 'unknown',
      message: error instanceof Error ? error.message : 'Failed to fetch logs',
      recoverable: true,
    })
  }
}

