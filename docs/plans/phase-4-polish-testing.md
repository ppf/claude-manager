# Phase 4: Polish & Testing

**Duration**: Week 7-8 (10-14 days)
**Branch**: `phase-4-polish-testing`
**Status**: 🔴 Not Started
**Prerequisites**: Phase 3 completed

---

## 📊 Phase Status

| Subphase | Status | Started | Completed | Branch |
|----------|--------|---------|-----------|--------|
| 4.1 Error Handling | 🔴 Not Started | - | - | phase-4.1-error-handling |
| 4.2 Testing | 🔴 Not Started | - | - | phase-4.2-testing |
| 4.3 Documentation & Polish | 🔴 Not Started | - | - | phase-4.3-docs-polish |

---

## 🎯 Phase Goal

Production-ready MVP with comprehensive testing and documentation:
- Comprehensive error handling across all features
- Unit tests (70%+ coverage)
- Integration tests for critical flows
- E2E tests for user journeys
- Complete documentation (README, setup guide)
- Performance optimization
- UX polish

**Success Criteria**:
✅ All error scenarios handled gracefully
✅ Test coverage ≥70%
✅ All critical flows have E2E tests
✅ README complete with setup instructions
✅ Performance optimized (<500ms for most operations)
✅ UX polished and intuitive
✅ Zero critical bugs

---

## 🌳 Subphase 4.1: Error Handling (2 days)

**Goal**: Comprehensive error handling and user feedback

### Tasks

#### Task 4.1.1: Improve Error Boundaries

**File**: `components/ErrorBoundary.tsx`

```typescript
'use client'

import React from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen">
          <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
          <p className="text-muted-foreground mb-4">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <Button onClick={() => this.setState({ hasError: false })}>
            Try again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
```

#### Task 4.1.2: Add Loading States

**File**: `components/ui/loading-spinner.tsx`

```typescript
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function LoadingSpinner({ className, size = 'md' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  return (
    <div className={cn('animate-spin rounded-full border-2 border-primary border-t-transparent', sizeClasses[size], className)} />
  )
}
```

#### Task 4.1.3: Enhance Toast Notifications

- Add success, error, warning, info variants
- Implement toast queue (max 3 visible)
- Add action buttons to toasts
- Improve positioning and animations

#### Task 4.1.4: Add Retry Logic for API Calls

**File**: `lib/api/client.ts`

```typescript
export async function apiCall<T>(
  url: string,
  options?: RequestInit,
  retries = 3
): Promise<T> {
  let lastError: Error | null = null

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options)
      const result = await response.json()

      if (result.success) {
        return result.data
      }

      // Don't retry validation errors
      if (result.error?.type === 'validation') {
        throw new Error(result.error.message)
      }

      lastError = new Error(result.error?.message || 'Request failed')
    } catch (error) {
      lastError = error as Error
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
      }
    }
  }

  throw lastError
}
```

#### Task 4.1.5: Backup and Recovery

**Goal**: Auto-backup before destructive operations

**File**: `lib/backup/backup-service.ts`

```typescript
import fs from 'fs/promises'
import path from 'path'

const BACKUP_DIR = path.join(process.cwd(), 'data', 'backups')

export interface Backup {
  id: string
  filePath: string
  timestamp: Date
  size: number
}

export async function createBackup(filePath: string, content: string): Promise<Backup> {
  await fs.mkdir(BACKUP_DIR, { recursive: true })

  const timestamp = Date.now()
  const backupId = `${path.basename(filePath)}-${timestamp}`
  const backupPath = path.join(BACKUP_DIR, backupId)

  await fs.writeFile(backupPath, content, 'utf-8')

  return {
    id: backupId,
    filePath,
    timestamp: new Date(timestamp),
    size: content.length,
  }
}

export async function restoreBackup(backupId: string): Promise<string> {
  const backupPath = path.join(BACKUP_DIR, backupId)
  return await fs.readFile(backupPath, 'utf-8')
}

export async function cleanOldBackups(retentionDays: number = 7): Promise<number> {
  // Remove backups older than retention period
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000
  const files = await fs.readdir(BACKUP_DIR)
  let deleted = 0

  for (const file of files) {
    const timestamp = parseInt(file.split('-').pop() || '0')
    if (timestamp < cutoff) {
      await fs.unlink(path.join(BACKUP_DIR, file))
      deleted++
    }
  }

  return deleted
}
```

**Note**: See `docs/plans/GAPS-AND-ADDITIONS.md` Task 4.1.5 (lines 970-1056) for complete implementation including UI components.

### Commit

```bash
git commit -m "phase-4.1: Enhance error handling and user feedback

- Add error boundary component
- Create loading spinner
- Enhance toast notifications
- Add retry logic for API calls
- Improve error messages"
```

---

## 🌳 Subphase 4.2: Testing (3-4 days)

**Goal**: 70%+ test coverage with unit, integration, and E2E tests

### Tasks

#### Task 4.2.0: Test Infrastructure Setup

**Goal**: Create test fixtures and mocks before writing tests

**File**: `tests/fixtures/claude-structure.ts`

```typescript
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

export async function createTestClaudeDirectory(): Promise<string> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'claude-test-'))

  // Create directory structure
  await fs.mkdir(path.join(tmpDir, 'skills'), { recursive: true })
  await fs.mkdir(path.join(tmpDir, 'plugins'), { recursive: true })

  // Create config files
  await fs.writeFile(
    path.join(tmpDir, 'CLAUDE.md'),
    '---\nname: Test Claude\n---\n\n# Test Configuration'
  )

  // Create test skill
  const skillDir = path.join(tmpDir, 'skills', 'test-skill')
  await fs.mkdir(skillDir, { recursive: true })
  await fs.writeFile(
    path.join(skillDir, 'SKILL.md'),
    '---\nname: Test Skill\n---\n\n# Test Skill'
  )

  return tmpDir
}

export async function cleanupTestDirectory(dir: string): Promise<void> {
  await fs.rm(dir, { recursive: true, force: true })
}
```

**File**: `tests/mocks/git-mock.ts`

```typescript
import { vi } from 'vitest'

export function mockGitOperations() {
  vi.mock('@/lib/git/git-manager', () => ({
    cloneRepository: vi.fn().mockResolvedValue(undefined),
    pullRepository: vi.fn().mockResolvedValue(undefined),
    getRepositoryInfo: vi.fn().mockResolvedValue({
      remotes: [],
      currentBranch: 'main',
      latestCommit: null,
    }),
  }))
}
```

**Note**: See `docs/plans/GAPS-AND-ADDITIONS.md` Task 4.2.0 (lines 877-967) for complete test infrastructure.

#### Task 4.2.1: Setup Vitest

**File**: `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'tests/'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
```

#### Task 4.2.2: Unit Tests

**Critical Areas to Test**:
- Path sanitization (`lib/claude/paths.ts`)
- File operations (`lib/api/filesystem.ts`)
- Git operations (`lib/git/git-manager.ts`)
- Search index (`lib/db/search-index.ts`)
- Validators (`lib/validators/*`)

**Example Test**: `tests/unit/paths.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { sanitizePath, getRelativePath } from '@/lib/claude/paths'

describe('Path utilities', () => {
  it('should prevent path traversal', () => {
    expect(() => sanitizePath('../../../etc/passwd')).toThrow()
  })

  it('should allow valid paths', () => {
    expect(sanitizePath('CLAUDE.md')).toBeTruthy()
  })

  it('should get relative path correctly', () => {
    const rel = getRelativePath('/Users/storm/.claude/CLAUDE.md')
    expect(rel).toBe('CLAUDE.md')
  })
})
```

#### Task 4.2.3: Integration Tests

**Critical Flows to Test**:
- Config file CRUD (read, write, delete)
- Skill installation (git clone)
- Search indexing and querying
- File tree navigation

#### Task 4.2.4: E2E Tests (Optional)

**Setup**: `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:3000',
    // SSL certificate bypass for local HTTPS (*.local domains)
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--ignore-certificate-errors',
            '--ignore-ssl-errors',
            '--allow-running-insecure-content',
          ],
        },
      },
    },
  ],
})
```

**Note**: SSL certificate bypass is required for testing local HTTPS environments (*.local domains) per user rules.

**File**: `tests/e2e/config-editing.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test('should edit and save config file', async ({ page }) => {
  await page.goto('http://localhost:3000/configs')

  // Click on CLAUDE.md
  await page.click('text=CLAUDE.md')

  // Wait for editor
  await page.waitForSelector('.monaco-editor')

  // Edit content (Monaco editor interaction)
  // ...

  // Verify save notification
  await expect(page.locator('text=File saved')).toBeVisible()
})
```

### Testing Goals

```yaml
Coverage Targets:
  - Overall: 70%+
  - Critical paths: 90%+
  - API routes: 80%+
  - Components: 60%+

Test Counts:
  - Unit tests: 50+
  - Integration tests: 20+
  - E2E tests: 10+
```

### Commit

```bash
git commit -m "phase-4.2: Add comprehensive test suite

- Set up Vitest configuration
- Add unit tests for utilities (50+ tests)
- Add integration tests for APIs (20+ tests)
- Add E2E tests for critical flows (10+ tests)
- Achieve 70%+ code coverage"
```

---

## 🌳 Subphase 4.3: Documentation & Polish (2-3 days)

**Goal**: Complete documentation and UX improvements

### Tasks

#### Task 4.3.1: Create README

**File**: `README.md`

```markdown
# Claude Code Manager

Web-based management tool for Claude Code configurations, skills, plugins, and MCP servers.

## Features

- 📝 **Config Editor**: Edit Claude Code configuration files with Monaco Editor
- 🎯 **Skills Management**: Install, create, and manage skills from marketplace
- 🔌 **Plugins Manager**: Manage plugins with ease
- 🔍 **Search**: Fast full-text search across all resources
- 🖥️ **MCP Configuration**: Configure and test MCP servers

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local

# Start development server
pnpm dev

# Open http://localhost:3000
```

## Development

```bash
# Type checking
pnpm type-check

# Linting
pnpm lint

# Tests
pnpm test
pnpm test:coverage

# Build
pnpm build
```

## Tech Stack

- Next.js 14+ (App Router)
- TypeScript
- React
- Tailwind CSS
- Monaco Editor
- SQLite (search)
- simple-git

## License

MIT
```

#### Task 4.3.2: Create CONTRIBUTING Guide

#### Task 4.3.3: Performance Optimization

**Checklist**:
- [ ] Lazy load Monaco Editor
- [ ] Optimize file tree rendering (virtual scrolling)
- [ ] Cache API responses (React Query)
- [ ] Debounce search input
- [ ] Optimize bundle size
- [ ] Add loading skeletons

#### Task 4.3.4: UX Polish

**Specifications**: See detailed UX requirements in:
- `docs/ux/loading-states.md` - Loading state specifications
- `docs/ux/accessibility.md` - WCAG 2.1 Level AA compliance targets
- `docs/performance/benchmarks.md` - Performance targets and measurement

**Checklist**:
- [ ] Consistent spacing and typography
- [ ] Smooth transitions and animations
- [ ] Keyboard shortcuts implemented (see GAPS-AND-ADDITIONS.md)
- [ ] Empty states for all lists
- [ ] Confirmation dialogs for destructive actions
- [ ] Accessibility improvements (ARIA labels, keyboard navigation)
- [ ] Loading states follow spec (200ms delay, 500ms minimum)
- [ ] Performance targets met (see benchmarks doc)

**Keyboard Shortcuts** (from GAPS):
- Cmd/Ctrl+S: Save
- Cmd/Ctrl+K: Search
- Cmd/Ctrl+N: New skill
- Escape: Close dialogs
- Alt+1/2/3/4: Navigate sections

**Note**: See `docs/plans/GAPS-AND-ADDITIONS.md` Task 4.3.4 expanded (lines 1060-1163) for complete UX specifications.

### Commit

```bash
git commit -m "phase-4.3: Add documentation and UX polish

- Create comprehensive README
- Add CONTRIBUTING guide
- Optimize performance (lazy loading, caching)
- Polish UX (transitions, empty states)
- Improve accessibility"
```

---

## ✅ Phase 4 Completion Checklist

### Code Quality
- [ ] TypeScript strict mode passing
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Prettier: All files formatted
- [ ] Test coverage ≥70%
- [ ] No console errors in production build

### Functionality
- [ ] All features working as specified
- [ ] Error handling comprehensive
- [ ] Loading states everywhere
- [ ] No data loss scenarios
- [ ] Git operations safe

### Documentation
- [ ] README complete
- [ ] CONTRIBUTING guide
- [ ] API documentation
- [ ] Component documentation
- [ ] Setup instructions

### Performance
- [ ] Page load <2s
- [ ] File operations <500ms
- [ ] Search <100ms
- [ ] No memory leaks
- [ ] Bundle size optimized

### UX
- [ ] Intuitive navigation
- [ ] Clear error messages
- [ ] Responsive design
- [ ] Keyboard shortcuts work
- [ ] Accessibility compliant

---

## 🎉 MVP Complete!

### Final Steps

1. **Merge to main**:
```bash
git checkout main
git merge phase-4-polish-testing
git push origin main
```

2. **Tag release**:
```bash
git tag v1.0.0-mvp
git push --tags
```

3. **Update MASTER-PLAN.md**:
```markdown
| **Phase 4**: Polish & Testing | 🟢 Completed | phase-4-polish-testing | 2025-XX-XX | 2025-XX-XX | [→ Phase 4](./phase-4-polish-testing.md) |
```

4. **Deploy** (if applicable)

5. **Celebrate!** 🚀

---

## 🔮 Post-MVP (Future)

See design document for post-MVP enhancements:
- Backup/restore configurations
- Template library
- Visual diff tool
- Skill development toolkit
- Remote access (authenticated)
