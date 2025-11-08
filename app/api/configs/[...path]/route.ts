import { NextRequest } from 'next/server'
import { readFile, writeFile, deleteFile } from '@/lib/api/filesystem'
import { successResponse, filesystemError } from '@/lib/api/response'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params
    const filePath = resolvedParams.path.join('/')
    const file = await readFile(filePath)
    return successResponse(file)
  } catch (error) {
    console.error('Error reading file:', error)
    return filesystemError(error instanceof Error ? error.message : 'Failed to read file')
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params
    const filePath = resolvedParams.path.join('/')
    const { content } = await request.json()

    if (typeof content !== 'string') {
      return filesystemError('Invalid content type')
    }

    await writeFile(filePath, content)
    return successResponse({ message: 'File saved successfully' })
  } catch (error) {
    console.error('Error writing file:', error)
    return filesystemError(error instanceof Error ? error.message : 'Failed to write file')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params
    const filePath = resolvedParams.path.join('/')
    await deleteFile(filePath)
    return successResponse({ message: 'File deleted successfully' })
  } catch (error) {
    console.error('Error deleting file:', error)
    return filesystemError(error instanceof Error ? error.message : 'Failed to delete file')
  }
}
