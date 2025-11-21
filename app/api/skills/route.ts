import { NextRequest } from 'next/server'
import { getLocalSkills, getMarketplaceSkills } from '@/lib/api/skills-service'
import { successResponse, errorResponse } from '@/lib/api/response'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const source = searchParams.get('source') // 'local' | 'marketplace' | 'all'
    const type = searchParams.get('type') // 'plugin' | 'skill' | 'all'
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)

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

    // Apply pagination if page parameter is provided
    const total = skills.length
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedSkills = skills.slice(startIndex, endIndex)
    const hasMore = endIndex < total

    return successResponse({
      skills: paginatedSkills,
      pagination: {
        page,
        pageSize,
        total,
        hasMore,
      },
    })
  } catch (error) {
    console.error('Error fetching skills:', error)
    return errorResponse({
      type: 'unknown',
      message: 'Failed to fetch skills',
      recoverable: true,
    })
  }
}
