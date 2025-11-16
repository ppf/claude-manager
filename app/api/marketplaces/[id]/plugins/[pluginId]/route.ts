import { NextRequest, NextResponse } from 'next/server'
import {
  getMarketplacePluginDetails,
  getPluginReadme,
} from '@/lib/api/marketplace-service'
import type { ApiResponse, MarketplacePlugin } from '@/types/claude-config'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; pluginId: string } }
) {
  try {
    const { id: marketplaceId, pluginId } = params
    const plugin = await getMarketplacePluginDetails(marketplaceId, pluginId)

    if (!plugin) {
      const response: ApiResponse = {
        success: false,
        error: {
          type: 'filesystem',
          message: `Plugin '${pluginId}' not found in marketplace '${marketplaceId}'`,
          recoverable: true,
        },
      }

      return NextResponse.json(response, { status: 404 })
    }

    // Get README content if requested
    const url = new URL(request.url)
    const includeReadme = url.searchParams.get('readme') === 'true'

    let readme: string | null = null
    if (includeReadme) {
      readme = await getPluginReadme(marketplaceId, pluginId)
    }

    const response: ApiResponse<MarketplacePlugin & { readme?: string | null }> = {
      success: true,
      data: {
        ...plugin,
        ...(includeReadme && { readme }),
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        type: 'filesystem',
        message: error instanceof Error ? error.message : 'Failed to fetch plugin details',
        recoverable: true,
      },
    }

    return NextResponse.json(response, { status: 500 })
  }
}
