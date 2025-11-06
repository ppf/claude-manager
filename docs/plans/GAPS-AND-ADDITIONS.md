# Gaps and Additions to Existing Plans

**Created**: 2025-11-02
**Status**: Active - Apply Before Starting Phase 1
**Purpose**: Documents all additions and modifications to existing phase plans

---

## 📋 Overview

This document contains all the additions and modifications needed for the existing phase plans (1-4) based on the gap analysis. Apply these changes before beginning implementation.

---

## 🔴 Phase 1 Additions

### Add Task 1.1.12: Environment Setup Checker

**Location**: After Task 1.1.11 in Phase 1.1
**Duration**: 2-3 hours

#### Create Setup Checker Service

**File**: `lib/claude/setup-checker.ts`

```typescript
import fs from 'fs/promises'
import path from 'path'
import { CLAUDE_HOME, CLAUDE_PATHS } from './paths'

export interface SetupStatus {
  claudeHomeExists: boolean
  hasWritePermission: boolean
  requiredDirsExist: string[]
  missingDirs: string[]
  validConfigs: string[]
  invalidConfigs: Array<{ file: string; error: string }>
  recommendations: string[]
  isFirstRun: boolean
  needsInitialization: boolean
}

export async function checkEnvironment(): Promise<SetupStatus> {
  const status: SetupStatus = {
    claudeHomeExists: false,
    hasWritePermission: false,
    requiredDirsExist: [],
    missingDirs: [],
    validConfigs: [],
    invalidConfigs: [],
    recommendations: [],
    isFirstRun: false,
    needsInitialization: false,
  }

  // Check if Claude home exists
  try {
    await fs.access(CLAUDE_HOME)
    status.claudeHomeExists = true
  } catch {
    status.claudeHomeExists = false
    status.isFirstRun = true
    status.needsInitialization = true
    status.recommendations.push('Claude home directory does not exist')
    return status
  }

  // Check write permissions
  try {
    const testFile = path.join(CLAUDE_HOME, '.write-test')
    await fs.writeFile(testFile, 'test')
    await fs.unlink(testFile)
    status.hasWritePermission = true
  } catch {
    status.hasWritePermission = false
    status.recommendations.push('No write permission to Claude home directory')
  }

  // Check required directories
  const requiredDirs = ['skills', 'plugins']
  
  for (const dir of requiredDirs) {
    const dirPath = path.join(CLAUDE_HOME, dir)
    try {
      await fs.access(dirPath)
      status.requiredDirsExist.push(dir)
    } catch {
      status.missingDirs.push(dir)
      status.recommendations.push(`Create ${dir}/ directory`)
    }
  }

  // Check config files
  const configFiles = ['CLAUDE.md', 'FLAGS.md', 'RULES.md']
  
  for (const file of configFiles) {
    const filePath = path.join(CLAUDE_HOME, file)
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      if (content.trim().length > 0) {
        status.validConfigs.push(file)
      } else {
        status.invalidConfigs.push({ file, error: 'File is empty' })
      }
    } catch {
      status.invalidConfigs.push({ file, error: 'File not found' })
    }
  }

  status.needsInitialization = status.missingDirs.length > 0

  return status
}

export async function initializeEnvironment(): Promise<void> {
  // Create Claude home if it doesn't exist
  await fs.mkdir(CLAUDE_HOME, { recursive: true })

  // Create required directories
  await fs.mkdir(CLAUDE_PATHS.SKILLS, { recursive: true })
  await fs.mkdir(path.join(CLAUDE_HOME, 'plugins'), { recursive: true })

  // Create default config files if they don't exist
  const defaultConfigs = {
    'CLAUDE.md': `# Claude Configuration

Welcome to Claude Code Manager!

## Getting Started

Edit this file to configure your Claude setup.
`,
    'FLAGS.md': `# Feature Flags

Configure feature flags here.
`,
    'RULES.md': `# Rules

Define your coding rules and conventions here.
`,
  }

  for (const [filename, content] of Object.entries(defaultConfigs)) {
    const filePath = path.join(CLAUDE_HOME, filename)
    try {
      await fs.access(filePath)
      // File exists, don't overwrite
    } catch {
      await fs.writeFile(filePath, content, 'utf-8')
    }
  }
}
```

#### Create Setup Wizard Component

**File**: `components/setup/SetupWizard.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import type { SetupStatus } from '@/lib/claude/setup-checker'

export function SetupWizard() {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<SetupStatus | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)

  useEffect(() => {
    checkSetup()
  }, [])

  async function checkSetup() {
    const response = await fetch('/api/setup/check')
    const result = await response.json()
    
    if (result.success) {
      setStatus(result.data)
      if (result.data.needsInitialization) {
        setOpen(true)
      }
    }
  }

  async function handleInitialize() {
    setIsInitializing(true)
    
    const response = await fetch('/api/setup/initialize', { method: 'POST' })
    const result = await response.json()
    
    if (result.success) {
      await checkSetup()
      setOpen(false)
    }
    
    setIsInitializing(false)
  }

  if (!status || !status.needsInitialization) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Setup Required</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Claude Code Manager needs to set up your environment.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {status.claudeHomeExists ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span>Claude home directory</span>
            </div>

            {status.missingDirs.map((dir) => (
              <div key={dir} className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span>Create {dir}/ directory</span>
              </div>
            ))}

            {status.recommendations.map((rec, i) => (
              <div key={i} className="text-sm text-muted-foreground ml-6">
                {rec}
              </div>
            ))}
          </div>

          <Button onClick={handleInitialize} disabled={isInitializing} className="w-full">
            {isInitializing ? 'Initializing...' : 'Initialize Environment'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

#### API Routes

**File**: `app/api/setup/check/route.ts`

```typescript
import { checkEnvironment } from '@/lib/claude/setup-checker'
import { successResponse, errorResponse } from '@/lib/api/response'

export async function GET() {
  try {
    const status = await checkEnvironment()
    return successResponse(status)
  } catch (error) {
    return errorResponse({
      type: 'unknown',
      message: 'Failed to check setup',
      recoverable: true,
    })
  }
}
```

**File**: `app/api/setup/initialize/route.ts`

```typescript
import { initializeEnvironment } from '@/lib/claude/setup-checker'
import { successResponse, errorResponse } from '@/lib/api/response'

export async function POST() {
  try {
    await initializeEnvironment()
    return successResponse({ message: 'Environment initialized successfully' })
  } catch (error) {
    return errorResponse({
      type: 'filesystem',
      message: 'Failed to initialize environment',
      recoverable: false,
    })
  }
}
```

#### Update Root Layout

**File**: `app/layout.tsx` (add to existing layout)

```typescript
import { SetupWizard } from '@/components/setup/SetupWizard'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex h-screen">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
        <Toaster />
        <SetupWizard />  {/* Add this */}
      </body>
    </html>
  )
}
```

---

### Add Task 1.3.6: File Conflict Detection

**Location**: After Task 1.3.5 in Phase 1.3
**Duration**: 2-3 hours

#### Update CodeEditor Component

**File**: `components/editor/CodeEditor.tsx` (modify existing)

```typescript
// Add to existing CodeEditor component

const [lastModified, setLastModified] = useState<number>(Date.now())
const [hasConflict, setHasConflict] = useState(false)

useEffect(() => {
  // Check for external modifications every 2 seconds
  const interval = setInterval(checkForConflicts, 2000)
  return () => clearInterval(interval)
}, [filePath])

async function checkForConflicts() {
  try {
    const response = await fetch(`/api/configs/${filePath}/mtime`)
    const result = await response.json()
    
    if (result.success && result.data.mtime > lastModified) {
      setHasConflict(true)
    }
  } catch (error) {
    // Ignore errors in background check
  }
}

async function handleReload() {
  const response = await fetch(`/api/configs/${filePath}`)
  const result = await response.json()
  
  if (result.success) {
    setContent(result.data.content)
    setLastModified(Date.now())
    setHasConflict(false)
    toast.info('File reloaded from disk')
  }
}

// Add conflict warning UI
{hasConflict && (
  <Alert className="m-4">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription className="flex items-center justify-between">
      <span>This file was modified externally</span>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={handleReload}>
          Reload
        </Button>
        <Button size="sm" onClick={() => setHasConflict(false)}>
          Keep Mine
        </Button>
      </div>
    </AlertDescription>
  </Alert>
)}
```

#### API Route for mtime

**File**: `app/api/configs/[...path]/mtime/route.ts`

```typescript
import { NextRequest } from 'next/server'
import fs from 'fs/promises'
import { sanitizePath } from '@/lib/claude/paths'
import { successResponse, filesystemError } from '@/lib/api/response'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = params.path.join('/')
    const fullPath = sanitizePath(filePath)
    const stats = await fs.stat(fullPath)
    
    return successResponse({
      mtime: stats.mtimeMs,
      modified: stats.mtime.toISOString(),
    })
  } catch (error) {
    return filesystemError('Failed to get file modification time')
  }
}
```

---

### Add Subphase 1.4: File System Watching

**Location**: New subphase after 1.3
**Duration**: 1-2 days

#### Install Chokidar

```bash
pnpm add chokidar
pnpm add -D @types/chokidar
```

#### Create File Watcher Service

**File**: `lib/watchers/file-watcher.ts`

```typescript
import chokidar from 'chokidar'
import { CLAUDE_HOME } from '@/lib/claude/paths'
import { EventEmitter } from 'events'

export type FileChangeEvent = {
  type: 'add' | 'change' | 'unlink'
  path: string
  timestamp: number
}

class FileWatcherService extends EventEmitter {
  private watcher: chokidar.FSWatcher | null = null

  start() {
    if (this.watcher) return

    this.watcher = chokidar.watch(CLAUDE_HOME, {
      ignored: /(^|[\/\\])\../, // Ignore dotfiles
      persistent: true,
      ignoreInitial: true,
    })

    this.watcher
      .on('add', (path) => this.emit('change', { type: 'add', path, timestamp: Date.now() }))
      .on('change', (path) => this.emit('change', { type: 'change', path, timestamp: Date.now() }))
      .on('unlink', (path) => this.emit('change', { type: 'unlink', path, timestamp: Date.now() }))
  }

  stop() {
    if (this.watcher) {
      this.watcher.close()
      this.watcher = null
    }
  }
}

export const fileWatcher = new FileWatcherService()
```

#### Update Search Index on Changes

**File**: `lib/db/search-index.ts` (add to existing)

```typescript
import { fileWatcher } from '@/lib/watchers/file-watcher'

// Start watching on app startup
fileWatcher.start()

fileWatcher.on('change', async (event) => {
  // Debounce updates
  await updateIndexForFile(event.path)
})
```

---

## 🔴 Phase 2 Additions

### Add Task 2.1.6: Marketplace Integration Strategy

**Location**: After Task 2.1.5 in Phase 2.1
**Duration**: 3-4 hours

#### Create Marketplace Adapter Interface

**File**: `lib/marketplace/adapter-interface.ts`

```typescript
export interface MarketplaceSkill {
  id: string
  name: string
  description: string
  author: string
  version: string
  gitUrl: string
  stars?: number
  downloads?: number
  tags?: string[]
  category?: string
}

export interface MarketplaceAdapter {
  fetchSkills(): Promise<MarketplaceSkill[]>
  searchSkills(query: string): Promise<MarketplaceSkill[]>
  getSkillDetails(id: string): Promise<MarketplaceSkill>
}
```

#### Implement GitHub Adapter

**File**: `lib/marketplace/github-adapter.ts`

```typescript
import type { MarketplaceAdapter, MarketplaceSkill } from './adapter-interface'

export class GitHubMarketplaceAdapter implements MarketplaceAdapter {
  private org: string
  private cache: Map<string, { data: MarketplaceSkill[]; timestamp: number }> = new Map()
  private cacheTime: number = 24 * 60 * 60 * 1000 // 24 hours

  constructor(org: string) {
    this.org = org
  }

  async fetchSkills(): Promise<MarketplaceSkill[]> {
    const cached = this.cache.get('all')
    if (cached && Date.now() - cached.timestamp < this.cacheTime) {
      return cached.data
    }

    try {
      // Fetch from GitHub API
      const response = await fetch(`https://api.github.com/orgs/${this.org}/repos`, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch from GitHub')
      }

      const repos = await response.json()

      const skills: MarketplaceSkill[] = repos
        .filter((repo: any) => repo.name.startsWith('claude-skill-'))
        .map((repo: any) => ({
          id: repo.name,
          name: repo.name.replace('claude-skill-', ''),
          description: repo.description || '',
          author: this.org,
          version: '1.0.0', // Would need to read from repo
          gitUrl: repo.clone_url,
          stars: repo.stargazers_count,
          tags: repo.topics || [],
        }))

      this.cache.set('all', { data: skills, timestamp: Date.now() })

      return skills
    } catch (error) {
      // Return cached data if available, even if stale
      const cached = this.cache.get('all')
      if (cached) {
        return cached.data
      }
      throw error
    }
  }

  async searchSkills(query: string): Promise<MarketplaceSkill[]> {
    const all = await this.fetchSkills()
    return all.filter(
      (skill) =>
        skill.name.toLowerCase().includes(query.toLowerCase()) ||
        skill.description.toLowerCase().includes(query.toLowerCase())
    )
  }

  async getSkillDetails(id: string): Promise<MarketplaceSkill> {
    const all = await this.fetchSkills()
    const skill = all.find((s) => s.id === id)
    if (!skill) {
      throw new Error('Skill not found')
    }
    return skill
  }
}
```

#### Environment Configuration

**File**: `.env.local` (add)

```bash
# Marketplace Configuration
MARKETPLACE_TYPE=github  # github | api | file
MARKETPLACE_GITHUB_ORG=claude-skills  # Replace with actual org
MARKETPLACE_CACHE_TTL=86400  # 24 hours
```

---

### Add Task 2.1.7: Git Authentication Handling

**Location**: After Task 2.1.6 in Phase 2.1
**Duration**: 1-2 hours

#### Improve Git Error Handling

**File**: `lib/git/git-manager.ts` (update)

```typescript
export class GitAuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GitAuthError'
  }
}

export async function cloneRepository(repo: GitRepository): Promise<void> {
  try {
    const targetPath = path.join(CLAUDE_PATHS.SKILLS, repo.directory)

    await git.clone(repo.url, targetPath, [
      repo.branch ? `--branch=${repo.branch}` : '',
    ].filter(Boolean))
  } catch (error: any) {
    // Detect authentication errors
    if (
      error.message.includes('Authentication failed') ||
      error.message.includes('Permission denied') ||
      error.message.includes('could not read Username')
    ) {
      throw new GitAuthError(
        'Authentication required. Please ensure you have access to this repository. ' +
        'For private repos, configure SSH keys or use personal access tokens.'
      )
    }

    throw error
  }
}
```

#### Add Authentication Help Dialog

**File**: `components/skills/GitAuthHelp.tsx`

```typescript
'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info } from 'lucide-react'

export function GitAuthHelpDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Git Authentication Setup</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Private repositories require authentication. Choose one of these methods:
            </AlertDescription>
          </Alert>

          <div>
            <h3 className="font-semibold mb-2">Method 1: SSH Keys (Recommended)</h3>
            <pre className="bg-muted p-3 rounded text-sm">
{`# Generate SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Add to GitHub/GitLab
cat ~/.ssh/id_ed25519.pub
# Copy and add to your Git provider settings`}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Method 2: Personal Access Token</h3>
            <pre className="bg-muted p-3 rounded text-sm">
{`# Create token at github.com/settings/tokens
# Use HTTPS URL with token:
git clone https://<TOKEN>@github.com/user/repo.git`}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Method 3: Git Credential Helper</h3>
            <pre className="bg-muted p-3 rounded text-sm">
{`# Cache credentials for 1 hour
git config --global credential.helper 'cache --timeout=3600'`}
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

---

## 🔴 Phase 3 Additions

### Add Task 3.1.7: Incremental Search Indexing

**Location**: After Task 3.1.6 in Phase 3.1
**Duration**: 2-3 hours

#### Update Search Index with File Watcher

**File**: `lib/db/search-index.ts` (add to existing)

```typescript
import { fileWatcher } from '@/lib/watchers/file-watcher'

let indexUpdateQueue: string[] = []
let indexUpdateTimeout: NodeJS.Timeout | null = null

// Debounced index updates
fileWatcher.on('change', (event) => {
  if (event.type === 'unlink') {
    removeFromIndex(event.path)
  } else {
    queueIndexUpdate(event.path)
  }
})

function queueIndexUpdate(path: string) {
  if (!indexUpdateQueue.includes(path)) {
    indexUpdateQueue.push(path)
  }

  if (indexUpdateTimeout) {
    clearTimeout(indexUpdateTimeout)
  }

  indexUpdateTimeout = setTimeout(() => {
    processIndexQueue()
  }, 1000) // Debounce 1 second
}

async function processIndexQueue() {
  const paths = [...indexUpdateQueue]
  indexUpdateQueue = []

  for (const path of paths) {
    await updateIndexForFile(path)
  }
}

async function updateIndexForFile(filePath: string) {
  // Read file
  // Parse content
  // Update or insert into search index
  // Emit update event for UI refresh
}

async function removeFromIndex(filePath: string) {
  // Remove from search index
}
```

---

### Expand Task 3.2.1: MCP Service

**Location**: Task 3.2.1 in Phase 3.2
**Addition**: Add detailed health check and log parsing

#### MCP Health Check

**File**: `lib/api/mcp-service.ts` (add to existing)

```typescript
import { spawn, ChildProcess } from 'child_process'

export interface MCPServerStatus {
  running: boolean
  pid?: number
  uptime?: number
  lastHealthCheck?: Date
  error?: string
}

const runningServers: Map<string, { process: ChildProcess; startTime: number }> = new Map()

export async function startMCPServer(server: MCPServer): Promise<void> {
  const process = spawn(server.command, server.args || [], {
    env: { ...process.env, ...server.env },
  })

  runningServers.set(server.id, {
    process,
    startTime: Date.now(),
  })

  process.on('error', (error) => {
    console.error(`MCP server ${server.id} error:`, error)
    runningServers.delete(server.id)
  })

  process.on('exit', (code) => {
    console.log(`MCP server ${server.id} exited with code ${code}`)
    runningServers.delete(server.id)
  })
}

export async function stopMCPServer(serverId: string): Promise<void> {
  const server = runningServers.get(serverId)
  if (server) {
    server.process.kill()
    runningServers.delete(serverId)
  }
}

export async function getServerStatus(serverId: string): Promise<MCPServerStatus> {
  const server = runningServers.get(serverId)
  
  if (!server) {
    return { running: false }
  }

  return {
    running: true,
    pid: server.process.pid,
    uptime: Date.now() - server.startTime,
    lastHealthCheck: new Date(),
  }
}

export async function testMCPConnection(server: MCPServer): Promise<boolean> {
  try {
    // Start server temporarily
    await startMCPServer(server)
    
    // Wait a bit for startup
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Check if still running
    const status = await getServerStatus(server.id)
    
    // Stop test server
    await stopMCPServer(server.id)
    
    return status.running
  } catch (error) {
    return false
  }
}
```

---

## 🔴 Phase 4 Additions

### Add Task 4.2.0: Test Infrastructure Setup

**Location**: Before Task 4.2.1 in Phase 4.2
**Duration**: 2-3 hours

#### Create Test Fixtures

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

  await fs.writeFile(
    path.join(tmpDir, 'FLAGS.md'),
    '# Feature Flags\n\ntest_flag: true'
  )

  // Create test skill
  const skillDir = path.join(tmpDir, 'skills', 'test-skill')
  await fs.mkdir(skillDir, { recursive: true })
  await fs.writeFile(
    path.join(skillDir, 'SKILL.md'),
    '---\nname: Test Skill\ndescription: A test skill\n---\n\n# Test Skill'
  )

  return tmpDir
}

export async function cleanupTestDirectory(dir: string): Promise<void> {
  await fs.rm(dir, { recursive: true, force: true })
}
```

**File**: `tests/setup.ts`

```typescript
import { beforeAll, afterAll } from 'vitest'
import { createTestClaudeDirectory, cleanupTestDirectory } from './fixtures/claude-structure'

let testDir: string

beforeAll(async () => {
  testDir = await createTestClaudeDirectory()
  process.env.CLAUDE_HOME = testDir
})

afterAll(async () => {
  await cleanupTestDirectory(testDir)
})
```

#### Mock Git Operations

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
    isGitRepository: vi.fn().mockResolvedValue(false),
  }))
}
```

---

### Add Task 4.1.5: Specific Recovery Strategies

**Location**: After Task 4.1.4 in Phase 4.1
**Duration**: 3-4 hours

#### Auto-Backup Service

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

export async function listBackups(filePath?: string): Promise<Backup[]> {
  try {
    const files = await fs.readdir(BACKUP_DIR)
    const backups: Backup[] = []

    for (const file of files) {
      if (filePath && !file.startsWith(path.basename(filePath))) {
        continue
      }

      const stats = await fs.stat(path.join(BACKUP_DIR, file))
      const timestamp = parseInt(file.split('-').pop() || '0')

      backups.push({
        id: file,
        filePath: filePath || file.split('-')[0],
        timestamp: new Date(timestamp),
        size: stats.size,
      })
    }

    return backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  } catch {
    return []
  }
}

export async function restoreBackup(backupId: string): Promise<string> {
  const backupPath = path.join(BACKUP_DIR, backupId)
  return await fs.readFile(backupPath, 'utf-8')
}

export async function cleanOldBackups(retentionDays: number = 7): Promise<number> {
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

---

### Expand Task 4.3.4: UX Polish

**Location**: Task 4.3.4 in Phase 4
**Addition**: Add specific UX requirements

#### Loading States Specification

**File**: `docs/ux/loading-states.md`

```markdown
# Loading States Specification

## Global Loading
- Full-page spinner on initial load
- Skeleton loaders for content areas

## Component Loading
- Button: Disabled + "Loading..." text + spinner
- List: Skeleton cards (3-5 items)
- Editor: "Loading file..." overlay

## Timing
- Show loading after 200ms (prevent flash)
- Minimum display time: 500ms (prevent flicker)
```

#### Keyboard Shortcuts

**File**: `lib/shortcuts/keyboard-shortcuts.ts`

```typescript
export const SHORTCUTS = {
  SAVE: 'Cmd+S / Ctrl+S',
  SEARCH: 'Cmd+K / Ctrl+K',
  NEW_SKILL: 'Cmd+N / Ctrl+N',
  CLOSE: 'Escape',
  NAVIGATE_CONFIGS: 'Alt+1',
  NAVIGATE_SKILLS: 'Alt+2',
  NAVIGATE_PLUGINS: 'Alt+3',
  NAVIGATE_MCP: 'Alt+4',
}
```

#### Accessibility Targets

**File**: `docs/ux/accessibility.md`

```markdown
# Accessibility Requirements

## WCAG 2.1 Level AA Compliance

### Keyboard Navigation
- All interactive elements keyboard accessible
- Visible focus indicators
- Logical tab order

### Screen Readers
- ARIA labels on all icons
- ARIA live regions for notifications
- Semantic HTML structure

### Color & Contrast
- Minimum contrast ratio 4.5:1 for text
- Don't rely on color alone

### Testing
- Test with keyboard only
- Test with screen reader (NVDA/JAWS)
- Use axe DevTools for automated checks
```

#### Performance Benchmarks

**File**: `docs/performance/benchmarks.md`

```markdown
# Performance Benchmarks

## Target Metrics

| Operation | Target | Acceptable | Poor |
|-----------|--------|------------|------|
| Initial page load | <1.5s | <2.5s | >3s |
| Route navigation | <200ms | <500ms | >1s |
| File read | <100ms | <300ms | >500ms |
| File save | <300ms | <800ms | >1.5s |
| Search query | <50ms | <150ms | >300ms |
| Git clone | <5s | <15s | >30s |
| Index rebuild (1000 files) | <3s | <8s | >15s |

## Measurement
- Use browser DevTools Performance tab
- Measure Core Web Vitals (LCP, FID, CLS)
- Profile in both dev and production builds

## Optimization Priorities
1. Code splitting (dynamic imports)
2. Image optimization
3. Bundle size reduction
4. Lazy loading
5. Caching strategies
```

---

## 📊 Summary of Additions

### Phase 1
- ✅ Task 1.1.12: Environment setup checker
- ✅ Task 1.3.6: File conflict detection
- ✅ Subphase 1.4: File system watching

### Phase 2
- ✅ Task 2.1.6: Marketplace integration strategy
- ✅ Task 2.1.7: Git authentication handling

### Phase 3
- ✅ Task 3.1.7: Incremental search indexing
- ✅ Expanded Task 3.2.1: MCP health checks and process management

### Phase 4
- ✅ Task 4.2.0: Test infrastructure setup
- ✅ Task 4.1.5: Backup and recovery strategies
- ✅ Expanded Task 4.3.4: UX polish specifications

---

## 📝 Implementation Checklist

Before starting Phase 1:
- [ ] Review this document thoroughly
- [ ] Update Phase 1-4 documents with additions
- [ ] Complete Phase 0 research
- [ ] Update MASTER-PLAN with revised timeline
- [ ] Commit all updated documents

---

## ⏱️ Revised Timeline Impact

**Original Timeline**: 6-8 weeks  
**With Additions**: +2-3 weeks  
**New Timeline**: 9-11 weeks

**Breakdown**:
- Phase 0: +2-3 days
- Phase 1: +2 days (tasks 1.1.12, 1.3.6, 1.4)
- Phase 2: +4 days (tasks 2.1.6, 2.1.7, full 2.2, 2.3)
- Phase 3: +1 day (task 3.1.7, expanded 3.2.1)
- Phase 4: +2 days (tasks 4.2.0, 4.1.5, expanded 4.3.4)
- Buffer: +3-5 days

---

**Status**: Ready for application to phase documents
