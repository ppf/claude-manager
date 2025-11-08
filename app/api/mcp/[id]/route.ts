import { NextRequest } from 'next/server'
import { getServer, updateServer, deleteServer } from '@/lib/api/mcp-service'
import { successResponse, errorResponse } from '@/lib/api/response'

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const server = await getServer(id)

    if (!server) {
      return errorResponse({
        type: 'unknown',
        message: `Server '${id}' not found`,
        recoverable: false,
      }, 404)
    }

    return successResponse(server)
  } catch (error) {
    console.error('Error fetching MCP server:', error)
    return errorResponse({
      type: 'unknown',
      message: error instanceof Error ? error.message : 'Failed to fetch MCP server',
      recoverable: true,
    })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const server = await updateServer(id, body)
    return successResponse(server)
  } catch (error) {
    console.error('Error updating MCP server:', error)
    return errorResponse({
      type: 'unknown',
      message: error instanceof Error ? error.message : 'Failed to update MCP server',
      recoverable: true,
    }, 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await deleteServer(id)
    return successResponse({ message: 'Server deleted successfully' })
  } catch (error) {
    console.error('Error deleting MCP server:', error)
    return errorResponse({
      type: 'unknown',
      message: error instanceof Error ? error.message : 'Failed to delete MCP server',
      recoverable: true,
    }, 500)
  }
}

