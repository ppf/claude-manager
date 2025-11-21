import { NextRequest, NextResponse } from 'next/server'
import { getMarketplaceDetails } from '@/lib/api/marketplace-service'
import type { ApiResponse, Marketplace } from '@/types/claude-config'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const marketplaceId = params.id
    const marketplace = await getMarketplaceDetails(marketplaceId)

    if (!marketplace) {
      const response: ApiResponse = {
        success: false,
        error: {
          type: 'filesystem',
          message: `Marketplace '${marketplaceId}' not found`,
          recoverable: true,
        },
      }

      return NextResponse.json(response, { status: 404 })
    }

    const response: ApiResponse<Marketplace> = {
      success: true,
      data: marketplace,
    }

    return NextResponse.json(response)
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        type: 'filesystem',
        message: error instanceof Error ? error.message : 'Failed to fetch marketplace details',
        recoverable: true,
      },
    }

    return NextResponse.json(response, { status: 500 })
  }
}
