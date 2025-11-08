import { vi } from 'vitest'

/**
 * Mock git operations for testing
 */
export function mockGitOperations() {
  vi.mock('@/lib/git/git-manager', () => ({
    cloneRepository: vi.fn().mockResolvedValue(undefined),
    pullRepository: vi.fn().mockResolvedValue(undefined),
    getRepositoryInfo: vi.fn().mockResolvedValue({
      remotes: [{ name: 'origin', url: 'https://github.com/test/repo.git' }],
      currentBranch: 'main',
      latestCommit: {
        hash: 'abc123',
        message: 'Test commit',
        date: new Date('2025-01-01'),
      },
    }),
    isGitRepository: vi.fn().mockResolvedValue(false),
    initializeRepository: vi.fn().mockResolvedValue(undefined),
  }))
}

/**
 * Reset git mocks
 */
export function resetGitMocks() {
  vi.clearAllMocks()
}

