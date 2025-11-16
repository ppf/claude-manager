import { NextRequest, NextResponse } from 'next/server'
import { getMarketplacePlugins } from '@/lib/api/marketplace-service'
import type { ApiResponse, MarketplacePlugin } from '@/types/claude-config'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const marketplaceId = params.id
    const plugins = await getMarketplacePlugins(marketplaceId)

    const response: ApiResponse<MarketplacePlugin[]> = {
      success: true,
      data: plugins,
    }

    return NextResponse.json(response)
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        type: 'filesystem',
        message: error instanceof Error ? error.message : 'Failed to fetch marketplace plugins',
        recoverable: true,
      },
    }

    return NextResponse.json(response, { status: 500 })
  }
}
