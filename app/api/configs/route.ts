import { NextRequest } from 'next/server'
import { readDirectory } from '@/lib/api/filesystem'
import { successResponse, filesystemError } from '@/lib/api/response'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const path = searchParams.get('path') || ''

    const tree = await readDirectory(path)
    return successResponse(tree)
  } catch (error) {
    console.error('Error reading directory:', error)
    return filesystemError(error instanceof Error ? error.message : 'Failed to read directory')
  }
}
