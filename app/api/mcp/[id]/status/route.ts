import { NextRequest } from 'next/server'
import { getServerStatus } from '@/lib/api/mcp-service'
import { successResponse, errorResponse } from '@/lib/api/response'

export const runtime = 'nodejs'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const status = await getServerStatus(id)

    return successResponse(status)
  } catch (error) {
    console.error('Error fetching server status:', error)
    return errorResponse({
      type: 'unknown',
      message: error instanceof Error ? error.message : 'Failed to fetch status',
      recoverable: true,
    })
  }
}
