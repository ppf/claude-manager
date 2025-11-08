import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  upsertDocument,
  removeDocument,
  query,
  clearIndex,
  getDocumentCount,
  closeDatabase,
} from '@/lib/db/search-index'

describe('Search index', () => {
  beforeEach(() => {
    clearIndex()
  })

  afterEach(() => {
    clearIndex()
  })

  it('should upsert a document', () => {
    upsertDocument({
      id: 'test-1',
      type: 'config',
      title: 'Test Config',
      path: 'test.md',
      body: 'This is a test document',
    })

    expect(getDocumentCount()).toBe(1)
  })

  it('should update existing document', () => {
    upsertDocument({
      id: 'test-1',
      type: 'config',
      title: 'Test Config',
      path: 'test.md',
      body: 'Original content',
    })

    upsertDocument({
      id: 'test-1',
      type: 'config',
      title: 'Test Config Updated',
      path: 'test.md',
      body: 'Updated content',
    })

    expect(getDocumentCount()).toBe(1)
  })

  it('should remove a document', () => {
    upsertDocument({
      id: 'test-1',
      type: 'config',
      title: 'Test Config',
      path: 'test.md',
      body: 'Test content',
    })

    removeDocument('test-1')
    expect(getDocumentCount()).toBe(0)
  })

  it('should search documents by content', () => {
    upsertDocument({
      id: 'test-1',
      type: 'config',
      title: 'Test Config',
      path: 'test.md',
      body: 'This document contains the word TypeScript',
    })

    const results = query('TypeScript')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].id).toBe('test-1')
  })

  it('should filter by type', () => {
    upsertDocument({
      id: 'config-1',
      type: 'config',
      title: 'Config',
      path: 'config.md',
      body: 'Configuration file',
    })

    upsertDocument({
      id: 'skill-1',
      type: 'skill',
      title: 'Skill',
      path: 'skill.md',
      body: 'Skill file',
    })

    const configResults = query('file', 'config')
    expect(configResults.length).toBe(1)
    expect(configResults[0].type).toBe('config')
  })

  it('should return empty array for no matches', () => {
    upsertDocument({
      id: 'test-1',
      type: 'config',
      title: 'Test',
      path: 'test.md',
      body: 'Some content',
    })

    const results = query('nonexistent')
    expect(results).toEqual([])
  })

  it('should limit results', () => {
    for (let i = 0; i < 50; i++) {
      upsertDocument({
        id: `doc-${i}`,
        type: 'config',
        title: `Doc ${i}`,
        path: `doc-${i}.md`,
        body: 'test content',
      })
    }

    const results = query('test', undefined, 10)
    expect(results.length).toBeLessThanOrEqual(10)
  })

  it('should clear all documents', () => {
    upsertDocument({
      id: 'test-1',
      type: 'config',
      title: 'Test',
      path: 'test.md',
      body: 'Content',
    })

    clearIndex()
    expect(getDocumentCount()).toBe(0)
  })
})

