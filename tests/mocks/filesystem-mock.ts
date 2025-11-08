import { vi } from 'vitest'

/**
 * Mock filesystem operations for testing
 */
export function mockFilesystem() {
  const mockFiles = new Map<string, string>()

  vi.mock('fs/promises', () => ({
    readFile: vi.fn((path: string) => {
      const content = mockFiles.get(path)
      if (!content) {
        throw new Error(`File not found: ${path}`)
      }
      return Promise.resolve(content)
    }),
    writeFile: vi.fn((path: string, content: string) => {
      mockFiles.set(path, content)
      return Promise.resolve()
    }),
    unlink: vi.fn((path: string) => {
      mockFiles.delete(path)
      return Promise.resolve()
    }),
    readdir: vi.fn(() => Promise.resolve(Array.from(mockFiles.keys()))),
    stat: vi.fn((path: string) => {
      if (!mockFiles.has(path)) {
        throw new Error(`File not found: ${path}`)
      }
      return Promise.resolve({
        isDirectory: () => false,
        isFile: () => true,
        size: mockFiles.get(path)?.length || 0,
        mtime: new Date(),
        mtimeMs: Date.now(),
      })
    }),
    mkdir: vi.fn(() => Promise.resolve(undefined)),
    access: vi.fn(() => Promise.resolve()),
  }))

  return {
    setFile: (path: string, content: string) => mockFiles.set(path, content),
    getFile: (path: string) => mockFiles.get(path),
    clear: () => mockFiles.clear(),
  }
}

