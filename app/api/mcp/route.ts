import { NextRequest } from 'next/server'
import { getAllServers, addServer } from '@/lib/api/mcp-service'
import { successResponse, errorResponse } from '@/lib/api/response'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const servers = await getAllServers()
    return successResponse(servers)
  } catch (error) {
    console.error('Error fetching MCP servers:', error)
    return errorResponse({
      type: 'unknown',
      message: error instanceof Error ? error.message : 'Failed to fetch MCP servers',
      recoverable: true,
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.command) {
      return errorResponse(
        {
          type: 'validation',
          message: 'Name and command are required',
          recoverable: true,
        },
        400
      )
    }

    const server = await addServer({
      name: body.name,
      command: body.command,
      args: body.args || [],
      env: body.env || {},
      enabled: body.enabled !== false,
    })

    return successResponse(server)
  } catch (error) {
    console.error('Error adding MCP server:', error)
    return errorResponse(
      {
        type: 'unknown',
        message: error instanceof Error ? error.message : 'Failed to add MCP server',
        recoverable: true,
      },
      500
    )
  }
}
