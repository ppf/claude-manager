import { NextRequest } from 'next/server'
import {
  getLocalSkills,
  getMarketplaceSkills,
} from '@/lib/api/skills-service'
import { successResponse, errorResponse } from '@/lib/api/response'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const source = searchParams.get('source') // 'local' | 'marketplace' | 'all'

    let skills = []

    if (source === 'marketplace') {
      skills = await getMarketplaceSkills()
    } else if (source === 'local') {
      skills = await getLocalSkills()
    } else {
      const [local, marketplace] = await Promise.all([
        getLocalSkills(),
        getMarketplaceSkills(),
      ])
      skills = [...local, ...marketplace]
    }

    return successResponse(skills)
  } catch (error) {
    console.error('Error fetching skills:', error)
    return errorResponse({
      type: 'unknown',
      message: 'Failed to fetch skills',
      recoverable: true,
    })
  }
}
