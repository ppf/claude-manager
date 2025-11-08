import { NextRequest } from 'next/server'
import { query } from '@/lib/db/search-index'
import { rebuildSearchIndex, startIncrementalIndexing } from '@/lib/db/indexer'
import { successResponse, errorResponse } from '@/lib/api/response'
import { getDocumentCount } from '@/lib/db/search-index'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Initialize search index on first request
let initialized = false

async function ensureInitialized() {
  if (initialized) return

  try {
    const count = getDocumentCount()

    if (count === 0) {
      // Database is empty, rebuild index
      await rebuildSearchIndex()
    }

    // Start incremental indexing
    startIncrementalIndexing()

    initialized = true
  } catch (error) {
    console.error('Failed to initialize search:', error)
    throw error
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureInitialized()

    const searchParams = request.nextUrl.searchParams
    const q = searchParams.get('q')
    const type = searchParams.get('type') as 'config' | 'skill' | 'plugin' | 'mcp' | null
    const limitStr = searchParams.get('limit')
    const limit = limitStr ? parseInt(limitStr, 10) : 20

    // Validate query
    if (!q || q.trim().length === 0) {
      return successResponse([])
    }

    // Validate type if provided
    if (type && !['config', 'skill', 'plugin', 'mcp'].includes(type)) {
      return errorResponse(
        {
          type: 'validation',
          message: 'Invalid type parameter. Must be one of: config, skill, plugin, mcp',
          recoverable: true,
        },
        400
      )
    }

    // Execute search
    const results = query(q, type || undefined, limit)

    return successResponse(results)
  } catch (error) {
    console.error('Search error:', error)
    return errorResponse(
      {
        type: 'unknown',
        message: error instanceof Error ? error.message : 'Search failed',
        recoverable: true,
      },
      500
    )
  }
}
