import { NextRequest } from 'next/server'
import { getLocalSkills, getMarketplaceSkills } from '@/lib/api/skills-service'
import { successResponse, errorResponse } from '@/lib/api/response'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const source = searchParams.get('source') // 'local' | 'marketplace' | 'all'
    const type = searchParams.get('type') // 'plugin' | 'skill' | 'all'

    let skills = []

    if (source === 'marketplace') {
      skills = await getMarketplaceSkills()
    } else if (source === 'local') {
      skills = await getLocalSkills()
    } else {
      const [local, marketplace] = await Promise.all([getLocalSkills(), getMarketplaceSkills()])
      skills = [...local, ...marketplace]
    }

    // Filter by type if requested
    if (type === 'plugin') {
      skills = skills.filter((skill) => skill.hasCommands)
    } else if (type === 'skill') {
      skills = skills.filter((skill) => !skill.hasCommands)
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
