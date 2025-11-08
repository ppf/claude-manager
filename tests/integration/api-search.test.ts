import { describe, it, expect, beforeEach } from 'vitest'
import { GET } from '@/app/api/search/route'
import { NextRequest } from 'next/server'
import { clearIndex, upsertDocument } from '@/lib/db/search-index'

describe('Search API', () => {
  beforeEach(() => {
    clearIndex()
  })

  it('should search documents', async () => {
    // Index test documents
    upsertDocument({
      id: 'test-1',
      type: 'config',
      title: 'Test Config',
      path: 'test.md',
      body: 'This is a TypeScript configuration file',
    })

    const request = new NextRequest('http://localhost:3000/api/search?q=TypeScript')
    const response = await GET(request)
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(data.data.length).toBeGreaterThan(0)
    expect(data.data[0].id).toBe('test-1')
  })

  it('should filter by type', async () => {
    upsertDocument({
      id: 'config-1',
      type: 'config',
      title: 'Config',
      path: 'config.md',
      body: 'Configuration content',
    })

    upsertDocument({
      id: 'skill-1',
      type: 'skill',
      title: 'Skill',
      path: 'skill.md',
      body: 'Skill content',
    })

    const request = new NextRequest('http://localhost:3000/api/search?q=content&type=config')
    const response = await GET(request)
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(data.data.length).toBe(1)
    expect(data.data[0].type).toBe('config')
  })

  it('should return empty array for empty query', async () => {
    const request = new NextRequest('http://localhost:3000/api/search?q=')
    const response = await GET(request)
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(data.data).toEqual([])
  })

  it('should handle invalid type parameter', async () => {
    const request = new NextRequest('http://localhost:3000/api/search?q=test&type=invalid')
    const response = await GET(request)
    const data = await response.json()

    expect(data.success).toBe(false)
    expect(data.error?.type).toBe('validation')
  })

  it('should limit results', async () => {
    for (let i = 0; i < 30; i++) {
      upsertDocument({
        id: `doc-${i}`,
        type: 'config',
        title: `Doc ${i}`,
        path: `doc-${i}.md`,
        body: 'test content',
      })
    }

    const request = new NextRequest('http://localhost:3000/api/search?q=test&limit=10')
    const response = await GET(request)
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(data.data.length).toBeLessThanOrEqual(10)
  })
})

