import { NextResponse } from 'next/server'
import { getMarketplaces } from '@/lib/api/marketplace-service'
import type { ApiResponse, Marketplace } from '@/types/claude-config'

export async function GET() {
  try {
    const marketplaces = await getMarketplaces()

    const response: ApiResponse<Marketplace[]> = {
      success: true,
      data: marketplaces,
    }

    return NextResponse.json(response)
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        type: 'filesystem',
        message: error instanceof Error ? error.message : 'Failed to fetch marketplaces',
        recoverable: true,
      },
    }

    return NextResponse.json(response, { status: 500 })
  }
}
