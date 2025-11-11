import { beforeAll, afterAll, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock environment variables
beforeAll(() => {
  // NODE_ENV is read-only, so we can't set it
  // It's already set to 'test' by vitest
  process.env.CLAUDE_HOME = '/tmp/claude-test'
  process.env.DATABASE_PATH = ':memory:'
})

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Global teardown
afterAll(() => {
  // Cleanup any resources
})

