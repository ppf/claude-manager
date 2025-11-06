# Phase 1: Core Foundation

**Duration**: Week 1-2 (10-14 days)
**Branch**: `phase-1-core-foundation`
**Status**: 🔴 Not Started

---

## 📊 Phase Status

| Subphase | Status | Started | Completed | Branch |
|----------|--------|---------|-----------|--------|
| 1.1 Project Setup | 🔴 Not Started | - | - | phase-1.1-project-setup |
| 1.2 File Browser | 🔴 Not Started | - | - | phase-1.2-file-browser |
| 1.3 Monaco Editor | 🔴 Not Started | - | - | phase-1.3-monaco-editor |
| 1.4 File Watching | 🔴 Not Started | - | - | phase-1.4-file-watching |

---

## 🎯 Phase Goal

Build the foundation of the application:
- Next.js project initialized with all dependencies
- Basic UI layout with navigation
- File browser for `~/.claude/` directory
- Monaco Editor integrated for config file editing
- File read/write API working
- Changes persisting to filesystem

**Success Criteria**:
✅ Can browse all files in `~/.claude/`
✅ Can open and edit files in Monaco Editor
✅ Can save changes (auto-save + manual)
✅ File changes persist to disk
✅ Basic error handling working
✅ TypeScript strict mode passing
✅ Setup wizard appears on first run
✅ File conflicts detected and user can resolve
✅ File watcher running and detecting changes

---

## 📋 Prerequisites

- [ ] Git repository initialized
- [ ] Node.js 18+ installed
- [ ] pnpm installed (`npm install -g pnpm`)
- [ ] Current branch is `main` or `master`
- [ ] Working directory is clean (`git status`)

---

## 🌳 Subphase 1.1: Project Setup (2-3 days)

**Goal**: Next.js project initialized with all core dependencies and configuration

### Branch Management

```bash
# Create main phase branch
git checkout -b phase-1-core-foundation

# Create subphase branch
git checkout -b phase-1.1-project-setup
```

### Tasks

#### Task 1.1.1: Initialize Next.js Project

```bash
# Initialize Next.js with TypeScript and Tailwind
pnpm create next-app@latest . \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --use-pnpm

# Answer prompts:
# ✔ Would you like to use ESLint? … Yes
# ✔ Would you like to use Turbopack? … No
```

**Files Created**:
- `package.json`
- `tsconfig.json`
- `next.config.js`
- `tailwind.config.ts`
- `postcss.config.js`
- `app/layout.tsx`
- `app/page.tsx`
- `app/globals.css`

#### Task 1.1.2: Install Core Dependencies

```bash
# UI Components (shadcn/ui dependencies)
pnpm add lucide-react class-variance-authority clsx tailwind-merge

# Editor
pnpm add @monaco-editor/react monaco-editor

# Forms & Validation
pnpm add zod react-hook-form @hookform/resolvers

# State Management
pnpm add zustand @tanstack/react-query

# Database
pnpm add better-sqlite3
pnpm add -D @types/better-sqlite3

# Git Operations
pnpm add simple-git

# File Operations
pnpm add gray-matter

# Search
pnpm add fuse.js

# UI Utilities
pnpm add sonner  # Toast notifications
pnpm add cmdk    # Command palette (optional)

# Dev Dependencies
pnpm add -D @types/node
pnpm add -D eslint-config-prettier
pnpm add -D prettier
pnpm add -D vitest @vitest/ui
pnpm add -D @testing-library/react @testing-library/jest-dom
```

#### Task 1.1.3: Configure shadcn/ui

```bash
# Initialize shadcn/ui
pnpm dlx shadcn-ui@latest init

# Answer prompts:
# ✔ Which style would you like to use? › Default
# ✔ Which color would you like to use as base color? › Slate
# ✔ Would you like to use CSS variables for colors? › yes

# Install initial components
pnpm dlx shadcn-ui@latest add button
pnpm dlx shadcn-ui@latest add input
pnpm dlx shadcn-ui@latest add label
pnpm dlx shadcn-ui@latest add toast
pnpm dlx shadcn-ui@latest add scroll-area
pnpm dlx shadcn-ui@latest add separator
pnpm dlx shadcn-ui@latest add tabs
pnpm dlx shadcn-ui@latest add card
pnpm dlx shadcn-ui@latest add dialog
pnpm dlx shadcn-ui@latest add dropdown-menu
```

**Files Created**:
- `components/ui/button.tsx`
- `components/ui/input.tsx`
- `components/ui/label.tsx`
- `components/ui/toast.tsx`
- `components/ui/*` (other components)
- `lib/utils.ts`
- `components.json`

#### Task 1.1.4: Create Directory Structure

```bash
# Create directory structure
mkdir -p app/api/configs
mkdir -p app/api/skills
mkdir -p app/api/plugins
mkdir -p app/api/mcp
mkdir -p app/api/search
mkdir -p app/api/claude-cli
mkdir -p app/configs
mkdir -p app/skills
mkdir -p app/plugins
mkdir -p app/mcp
mkdir -p components/editor
mkdir -p components/file-tree
mkdir -p components/layout
mkdir -p lib/api
mkdir -p lib/db
mkdir -p lib/git
mkdir -p lib/validators
mkdir -p lib/claude
mkdir -p types
mkdir -p tests/unit
mkdir -p tests/integration
```

**Final Structure**:
```
claude-manager/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   ├── configs/
│   │   ├── page.tsx
│   │   └── [file]/page.tsx
│   ├── skills/
│   ├── plugins/
│   ├── mcp/
│   └── api/
│       ├── configs/route.ts
│       ├── skills/route.ts
│       ├── plugins/route.ts
│       ├── mcp/route.ts
│       ├── search/route.ts
│       └── claude-cli/route.ts
├── components/
│   ├── ui/           # shadcn components
│   ├── editor/
│   ├── file-tree/
│   └── layout/
├── lib/
│   ├── api/
│   ├── db/
│   ├── git/
│   ├── validators/
│   ├── claude/
│   └── utils.ts
├── types/
└── tests/
```

#### Task 1.1.5: Configure TypeScript

**File**: `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

#### Task 1.1.6: Configure ESLint & Prettier

**File**: `.eslintrc.json`

```json
{
  "extends": [
    "next/core-web-vitals",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

**File**: `.prettierrc`

```json
{
  "semi": false,
  "trailingComma": "es5",
  "singleQuote": true,
  "tabWidth": 2,
  "useTabs": false,
  "printWidth": 100
}
```

**File**: `.prettierignore`

```
node_modules
.next
out
dist
*.md
```

#### Task 1.1.7: Create Environment Configuration

**File**: `.env.local`

```bash
# Claude Code home directory
CLAUDE_HOME=/Users/storm/.claude

# Database
DATABASE_PATH=./data/search.db

# Server
PORT=3000
NODE_ENV=development
```

**File**: `.env.example`

```bash
CLAUDE_HOME=~/.claude
DATABASE_PATH=./data/search.db
PORT=3000
NODE_ENV=development
```

#### Task 1.1.8: Create Core Type Definitions

**File**: `types/claude-config.ts`

```typescript
export type ConfigFileType = 'markdown' | 'json' | 'yaml' | 'text'

export interface ConfigFile {
  path: string
  name: string
  type: ConfigFileType
  content: string
  size: number
  modifiedAt: Date
  isDirectory: boolean
}

export interface FileTreeNode {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: FileTreeNode[]
  size?: number
  modifiedAt?: Date
}

export interface Skill {
  id: string
  name: string
  description: string
  path: string
  enabled: boolean
  source: 'local' | 'marketplace'
  version?: string
  author?: string
}

export interface Plugin {
  id: string
  name: string
  description: string
  version: string
  enabled: boolean
  config?: Record<string, any>
}

export interface MCPServer {
  id: string
  name: string
  command: string
  args?: string[]
  env?: Record<string, string>
  enabled: boolean
  status?: 'running' | 'stopped' | 'error'
}

export interface SearchResult {
  id: string
  type: 'config' | 'skill' | 'plugin' | 'mcp'
  title: string
  path: string
  excerpt: string
  score: number
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: ApiError
}

export interface ApiError {
  type: 'validation' | 'filesystem' | 'git' | 'claude-cli' | 'unknown'
  message: string
  details?: Record<string, any>
  recoverable: boolean
}
```

#### Task 1.1.9: Create Utility Functions

**File**: `lib/claude/paths.ts`

```typescript
import path from 'path'
import { homedir } from 'os'

export const CLAUDE_HOME = process.env.CLAUDE_HOME || path.join(homedir(), '.claude')

export function getClaudePath(...segments: string[]): string {
  return path.join(CLAUDE_HOME, ...segments)
}

export function sanitizePath(userPath: string): string {
  const resolved = path.resolve(CLAUDE_HOME, userPath)
  if (!resolved.startsWith(CLAUDE_HOME)) {
    throw new Error('Path traversal attempt detected')
  }
  return resolved
}

export function getRelativePath(absolutePath: string): string {
  return path.relative(CLAUDE_HOME, absolutePath)
}

export const CLAUDE_PATHS = {
  CONFIGS: getClaudePath(),
  SKILLS: getClaudePath('skills'),
  PLUGINS: getClaudePath('plugins'),
  MCP_CONFIG: getClaudePath('mcp-servers.json'),
} as const
```

#### Task 1.1.10: Create API Response Helper

**File**: `lib/api/response.ts`

```typescript
import { NextResponse } from 'next/server'
import type { ApiResponse, ApiError } from '@/types/claude-config'

export function successResponse<T>(data: T, status = 200): NextResponse {
  const response: ApiResponse<T> = {
    success: true,
    data,
  }
  return NextResponse.json(response, { status })
}

export function errorResponse(error: ApiError, status = 500): NextResponse {
  const response: ApiResponse = {
    success: false,
    error,
  }
  return NextResponse.json(response, { status })
}

export function validationError(message: string, details?: Record<string, any>): NextResponse {
  return errorResponse(
    {
      type: 'validation',
      message,
      details,
      recoverable: true,
    },
    400
  )
}

export function filesystemError(message: string, recoverable = false): NextResponse {
  return errorResponse(
    {
      type: 'filesystem',
      message,
      recoverable,
    },
    500
  )
}
```

#### Task 1.1.11: Update package.json Scripts

**File**: `package.json` (add to scripts section)

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

#### Task 1.1.12: Environment Setup Checker

**Goal**: Verify `~/.claude/` exists and initialize if needed

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
  needsInitialization: boolean
}

export async function checkEnvironment(): Promise<SetupStatus> {
  const status: SetupStatus = {
    claudeHomeExists: false,
    hasWritePermission: false,
    requiredDirsExist: [],
    missingDirs: [],
    needsInitialization: false,
  }

  // Check if Claude home exists
  try {
    await fs.access(CLAUDE_HOME)
    status.claudeHomeExists = true
  } catch {
    status.needsInitialization = true
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
    }
  }

  status.needsInitialization = status.missingDirs.length > 0
  return status
}

export async function initializeEnvironment(): Promise<void> {
  await fs.mkdir(CLAUDE_HOME, { recursive: true })
  await fs.mkdir(CLAUDE_PATHS.SKILLS, { recursive: true })
  await fs.mkdir(path.join(CLAUDE_HOME, 'plugins'), { recursive: true })
  
  // Create default config files if they don't exist
  const defaultConfigs = {
    'CLAUDE.md': '# Claude Configuration\n\nWelcome to Claude Code Manager!\n',
    'FLAGS.md': '# Feature Flags\n',
    'RULES.md': '# Rules\n',
  }

  for (const [filename, content] of Object.entries(defaultConfigs)) {
    const filePath = path.join(CLAUDE_HOME, filename)
    try {
      await fs.access(filePath)
    } catch {
      await fs.writeFile(filePath, content, 'utf-8')
    }
  }
}
```

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
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Claude Code Manager needs to set up your environment.
          </AlertDescription>
        </Alert>
        <Button onClick={handleInitialize} disabled={isInitializing} className="w-full">
          {isInitializing ? 'Initializing...' : 'Initialize Environment'}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
```

**API Routes**: `app/api/setup/check/route.ts` and `app/api/setup/initialize/route.ts`

**Note**: See `docs/plans/GAPS-AND-ADDITIONS.md` lines 17-320 for complete implementation details.

### Testing Checklist

- [ ] `pnpm install` completes successfully
- [ ] `pnpm dev` starts development server
- [ ] Can access http://localhost:3000
- [ ] `pnpm type-check` passes with no errors
- [ ] `pnpm lint` passes with no errors
- [ ] `pnpm format:check` passes

### Commit

```bash
git add .
git commit -m "phase-1.1: Initialize Next.js project with TypeScript, dependencies, and configuration

- Initialize Next.js 14+ with App Router
- Install core dependencies (Monaco, SQLite, shadcn/ui, etc.)
- Set up project structure and directories
- Configure TypeScript, ESLint, Prettier
- Create core type definitions
- Add utility functions for path handling
- Configure environment variables"

git push -u origin phase-1.1-project-setup
```

---

## 🌳 Subphase 1.2: File Browser (2-3 days)

**Goal**: File tree component that displays `~/.claude/` directory structure

### Branch Management

```bash
# Merge 1.1 into phase-1
git checkout phase-1-core-foundation
git merge phase-1.1-project-setup

# Create subphase branch
git checkout -b phase-1.2-file-browser
```

### Tasks

#### Task 1.2.1: Create File System Service

**File**: `lib/api/filesystem.ts`

```typescript
import fs from 'fs/promises'
import path from 'path'
import { CLAUDE_HOME, sanitizePath } from '@/lib/claude/paths'
import type { ConfigFile, FileTreeNode } from '@/types/claude-config'

export async function readDirectory(dirPath: string = ''): Promise<FileTreeNode[]> {
  const fullPath = sanitizePath(dirPath)
  const entries = await fs.readdir(fullPath, { withFileTypes: true })

  const nodes: FileTreeNode[] = []

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name)
    const stats = await fs.stat(path.join(fullPath, entry.name))

    const node: FileTreeNode = {
      name: entry.name,
      path: entryPath,
      type: entry.isDirectory() ? 'directory' : 'file',
      size: stats.size,
      modifiedAt: stats.mtime,
    }

    // Recursively read subdirectories
    if (entry.isDirectory()) {
      try {
        node.children = await readDirectory(entryPath)
      } catch (error) {
        // Skip directories we can't read
        node.children = []
      }
    }

    nodes.push(node)
  }

  // Sort: directories first, then alphabetically
  return nodes.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1
    }
    return a.name.localeCompare(b.name)
  })
}

export async function readFile(filePath: string): Promise<ConfigFile> {
  const fullPath = sanitizePath(filePath)
  const stats = await fs.stat(fullPath)

  if (stats.isDirectory()) {
    throw new Error('Cannot read directory as file')
  }

  const content = await fs.readFile(fullPath, 'utf-8')
  const ext = path.extname(filePath).toLowerCase()

  let type: ConfigFile['type'] = 'text'
  if (ext === '.md') type = 'markdown'
  else if (ext === '.json') type = 'json'
  else if (ext === '.yaml' || ext === '.yml') type = 'yaml'

  return {
    path: filePath,
    name: path.basename(filePath),
    type,
    content,
    size: stats.size,
    modifiedAt: stats.mtime,
    isDirectory: false,
  }
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  const fullPath = sanitizePath(filePath)

  // Create directory if it doesn't exist
  const dir = path.dirname(fullPath)
  await fs.mkdir(dir, { recursive: true })

  await fs.writeFile(fullPath, content, 'utf-8')
}

export async function deleteFile(filePath: string): Promise<void> {
  const fullPath = sanitizePath(filePath)
  await fs.unlink(fullPath)
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    const fullPath = sanitizePath(filePath)
    await fs.access(fullPath)
    return true
  } catch {
    return false
  }
}
```

#### Task 1.2.2: Create File Browser API Route

**File**: `app/api/configs/route.ts`

```typescript
import { NextRequest } from 'next/server'
import { readDirectory } from '@/lib/api/filesystem'
import { successResponse, errorResponse, filesystemError } from '@/lib/api/response'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const path = searchParams.get('path') || ''

    const tree = await readDirectory(path)
    return successResponse(tree)
  } catch (error) {
    console.error('Error reading directory:', error)
    return filesystemError(
      error instanceof Error ? error.message : 'Failed to read directory'
    )
  }
}
```

**File**: `app/api/configs/[...path]/route.ts`

```typescript
import { NextRequest } from 'next/server'
import { readFile, writeFile, deleteFile } from '@/lib/api/filesystem'
import { successResponse, filesystemError } from '@/lib/api/response'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = params.path.join('/')
    const file = await readFile(filePath)
    return successResponse(file)
  } catch (error) {
    console.error('Error reading file:', error)
    return filesystemError(
      error instanceof Error ? error.message : 'Failed to read file'
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = params.path.join('/')
    const { content } = await request.json()

    if (typeof content !== 'string') {
      return filesystemError('Invalid content type')
    }

    await writeFile(filePath, content)
    return successResponse({ message: 'File saved successfully' })
  } catch (error) {
    console.error('Error writing file:', error)
    return filesystemError(
      error instanceof Error ? error.message : 'Failed to write file'
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = params.path.join('/')
    await deleteFile(filePath)
    return successResponse({ message: 'File deleted successfully' })
  } catch (error) {
    console.error('Error deleting file:', error)
    return filesystemError(
      error instanceof Error ? error.message : 'Failed to delete file'
    )
  }
}
```

#### Task 1.2.3: Create File Tree Component

**File**: `components/file-tree/FileTreeNode.tsx`

```typescript
'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown, File, Folder } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FileTreeNode as FileTreeNodeType } from '@/types/claude-config'

interface FileTreeNodeProps {
  node: FileTreeNodeType
  level: number
  selectedPath?: string
  onSelect: (path: string) => void
}

export function FileTreeNode({ node, level, selectedPath, onSelect }: FileTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level === 0)
  const isSelected = selectedPath === node.path
  const isDirectory = node.type === 'directory'

  const handleClick = () => {
    if (isDirectory) {
      setIsExpanded(!isExpanded)
    }
    onSelect(node.path)
  }

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-accent rounded-sm',
          isSelected && 'bg-accent'
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleClick}
      >
        {isDirectory && (
          <span className="flex-shrink-0">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </span>
        )}
        {!isDirectory && <span className="w-4" />}

        <span className="flex-shrink-0">
          {isDirectory ? (
            <Folder className="h-4 w-4" />
          ) : (
            <File className="h-4 w-4" />
          )}
        </span>

        <span className="text-sm truncate">{node.name}</span>
      </div>

      {isDirectory && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              level={level + 1}
              selectedPath={selectedPath}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

**File**: `components/file-tree/FileTree.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { FileTreeNode } from './FileTreeNode'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { FileTreeNode as FileTreeNodeType } from '@/types/claude-config'

interface FileTreeProps {
  onFileSelect: (path: string) => void
}

export function FileTree({ onFileSelect }: FileTreeProps) {
  const [tree, setTree] = useState<FileTreeNodeType[]>([])
  const [selectedPath, setSelectedPath] = useState<string>()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchTree()
  }, [])

  async function fetchTree() {
    try {
      setIsLoading(true)
      const response = await fetch('/api/configs')
      const result = await response.json()

      if (result.success) {
        setTree(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch file tree:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelect = (path: string) => {
    setSelectedPath(path)
    onFileSelect(path)
  }

  if (isLoading) {
    return <div className="p-4">Loading...</div>
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-2">
        {tree.map((node) => (
          <FileTreeNode
            key={node.path}
            node={node}
            level={0}
            selectedPath={selectedPath}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </ScrollArea>
  )
}
```

#### Task 1.2.4: Create Layout with Sidebar

**File**: `components/layout/Sidebar.tsx`

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, Puzzle, Package, Server } from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Configs', href: '/configs', icon: FileText },
  { name: 'Skills', href: '/skills', icon: Puzzle },
  { name: 'Plugins', href: '/plugins', icon: Package },
  { name: 'MCP Servers', href: '/mcp', icon: Server },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col gap-2 p-4 border-r bg-muted/40 h-screen w-64">
      <div className="mb-4">
        <h1 className="text-xl font-bold">Claude Manager</h1>
      </div>

      <nav className="flex flex-col gap-1">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
```

**File**: `app/layout.tsx` (update)

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Sidebar } from '@/components/layout/Sidebar'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Claude Code Manager',
  description: 'Manage Claude Code configurations, skills, and plugins',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
      </body>
    </html>
  )
}
```

#### Task 1.2.5: Create Configs Page

**File**: `app/configs/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { FileTree } from '@/components/file-tree/FileTree'

export default function ConfigsPage() {
  const [selectedFile, setSelectedFile] = useState<string>()

  return (
    <div className="flex h-full">
      <div className="w-80 border-r">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Config Files</h2>
        </div>
        <FileTree onFileSelect={setSelectedFile} />
      </div>

      <div className="flex-1 p-4">
        {selectedFile ? (
          <div>
            <p className="text-sm text-muted-foreground">Selected: {selectedFile}</p>
            <p className="mt-4">Editor will go here (Phase 1.3)</p>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a file to edit
          </div>
        )}
      </div>
    </div>
  )
}
```

### Testing Checklist

- [ ] File tree loads and displays `~/.claude/` structure
- [ ] Can expand/collapse directories
- [ ] Can select files (highlight changes)
- [ ] Directories show before files (sorted alphabetically)
- [ ] API endpoints return correct data
- [ ] Error handling for invalid paths
- [ ] TypeScript compiles without errors
- [ ] No console errors in browser

### Commit

```bash
git add .
git commit -m "phase-1.2: Implement file browser with tree view

- Create filesystem service (read directory, read file, write file)
- Add API routes for file operations
- Build file tree component with expand/collapse
- Create sidebar navigation layout
- Add configs page with file browser
- Implement file selection highlighting"

git push -u origin phase-1.2-file-browser
```

---

## 🌳 Subphase 1.3: Monaco Editor (2-3 days)

**Goal**: Monaco Editor integrated for editing config files with auto-save

### Branch Management

```bash
# Merge 1.2 into phase-1
git checkout phase-1-core-foundation
git merge phase-1.2-file-browser

# Create subphase branch
git checkout -b phase-1.3-monaco-editor
```

### Tasks

#### Task 1.3.1: Create Monaco Editor Component

**File**: `components/editor/CodeEditor.tsx`

```typescript
'use client'

import { useEffect, useRef, useState } from 'react'
import Editor, { Monaco } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { useDebounce } from '@/hooks/useDebounce'
import { toast } from 'sonner'

interface CodeEditorProps {
  filePath: string
  initialContent: string
  language: string
  onSave?: (content: string) => void
  autoSave?: boolean
  autoSaveDelay?: number
}

export function CodeEditor({
  filePath,
  initialContent,
  language,
  onSave,
  autoSave = true,
  autoSaveDelay = 2000,
}: CodeEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [isSaving, setIsSaving] = useState(false)
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const debouncedContent = useDebounce(content, autoSaveDelay)

  // Auto-save when content changes (debounced)
  useEffect(() => {
    if (autoSave && debouncedContent !== initialContent && debouncedContent) {
      handleSave(debouncedContent)
    }
  }, [debouncedContent, autoSave])

  async function handleSave(contentToSave: string) {
    try {
      setIsSaving(true)
      const response = await fetch(`/api/configs/${filePath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: contentToSave }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('File saved')
        onSave?.(contentToSave)
      } else {
        toast.error(result.error?.message || 'Failed to save file')
      }
    } catch (error) {
      toast.error('Failed to save file')
      console.error('Save error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  function handleEditorDidMount(editor: editor.IStandaloneCodeEditor, monaco: Monaco) {
    editorRef.current = editor

    // Add Cmd/Ctrl+S to manually save
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave(editor.getValue())
    })
  }

  return (
    <div className="h-full relative">
      <Editor
        height="100%"
        language={language}
        value={content}
        onChange={(value) => setContent(value || '')}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          minimap: { enabled: true },
          fontSize: 14,
          lineNumbers: 'on',
          rulers: [80, 120],
          wordWrap: 'on',
          automaticLayout: true,
          scrollBeyondLastLine: false,
          fixedOverflowWidgets: true,
        }}
      />

      {isSaving && (
        <div className="absolute top-2 right-2 bg-background/80 px-3 py-1 rounded-md text-sm">
          Saving...
        </div>
      )}
    </div>
  )
}
```

#### Task 1.3.2: Create useDebounce Hook

**File**: `hooks/useDebounce.ts`

```typescript
import { useEffect, useState } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
```

#### Task 1.3.3: Create File Editor Page

**File**: `app/configs/[...file]/page.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CodeEditor } from '@/components/editor/CodeEditor'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import type { ConfigFile } from '@/types/claude-config'

export default function FileEditorPage() {
  const params = useParams()
  const router = useRouter()
  const filePath = Array.isArray(params.file) ? params.file.join('/') : params.file

  const [file, setFile] = useState<ConfigFile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchFile()
  }, [filePath])

  async function fetchFile() {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/configs/${filePath}`)
      const result = await response.json()

      if (result.success) {
        setFile(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch file:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <div className="p-4">Loading...</div>
  }

  if (!file) {
    return <div className="p-4">File not found</div>
  }

  const language = file.type === 'markdown' ? 'markdown' :
                   file.type === 'json' ? 'json' :
                   file.type === 'yaml' ? 'yaml' : 'plaintext'

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-4 p-4 border-b">
        <Button variant="ghost" size="sm" onClick={() => router.push('/configs')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h2 className="font-semibold">{file.name}</h2>
          <p className="text-sm text-muted-foreground">{filePath}</p>
        </div>
      </div>

      <div className="flex-1">
        <CodeEditor
          filePath={filePath}
          initialContent={file.content}
          language={language}
          autoSave={true}
          autoSaveDelay={2000}
        />
      </div>
    </div>
  )
}
```

#### Task 1.3.4: Update Configs Page to Navigate to Editor

**File**: `app/configs/page.tsx` (update)

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileTree } from '@/components/file-tree/FileTree'

export default function ConfigsPage() {
  const router = useRouter()
  const [selectedFile, setSelectedFile] = useState<string>()

  const handleFileSelect = (path: string) => {
    setSelectedFile(path)
    // Navigate to editor page
    router.push(`/configs/${path}`)
  }

  return (
    <div className="flex h-full">
      <div className="w-80 border-r">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Config Files</h2>
        </div>
        <FileTree onFileSelect={handleFileSelect} />
      </div>

      <div className="flex-1 p-4">
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Select a file to edit
        </div>
      </div>
    </div>
  )
}
```

#### Task 1.3.5: Add Validation (Optional but Recommended)

**File**: `lib/validators/config-validator.ts`

```typescript
import { z } from 'zod'

export const configFileSchema = z.object({
  content: z.string().min(1, 'Content cannot be empty'),
})

export function validateMarkdown(content: string): { valid: boolean; errors?: string[] } {
  // Basic markdown validation
  const errors: string[] = []

  // Check for common markdown issues
  if (content.includes('](') && !content.includes('](http')) {
    // Relative links might be broken
    // This is just a warning, not an error
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  }
}
```

#### Task 1.3.6: File Conflict Detection

**Goal**: Detect when files are modified externally and prompt user

**Update**: `components/editor/CodeEditor.tsx` (add conflict detection)

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

**API Route**: `app/api/configs/[...path]/mtime/route.ts`

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

**Note**: See `docs/plans/GAPS-AND-ADDITIONS.md` lines 323-416 for complete implementation.

### Testing Checklist

- [ ] Monaco Editor loads with correct syntax highlighting
- [ ] Can edit file content
- [ ] Auto-save works after 2 seconds of inactivity
- [ ] Manual save works with Cmd/Ctrl+S
- [ ] Toast notifications show save status
- [ ] Can navigate back to configs list
- [ ] Edited content persists to disk
- [ ] Can open different files and edit independently
- [ ] No performance issues with large files
- [ ] TypeScript compiles without errors

### Commit

```bash
git add .
git commit -m "phase-1.3: Integrate Monaco Editor with auto-save

- Create CodeEditor component with Monaco
- Implement auto-save with debouncing (2s delay)
- Add manual save with Cmd/Ctrl+S
- Create file editor page with navigation
- Add useDebounce hook
- Implement save feedback with toast notifications
- Support markdown, JSON, YAML syntax highlighting"

git push -u origin phase-1.3-monaco-editor
```

---

## 🌳 Subphase 1.4: File System Watching (1-2 days)

**Goal**: Real-time detection of external file changes

**Note**: This subphase enables automatic search index updates and better conflict detection.

### Branch Management

```bash
git checkout phase-1-core-foundation
git merge phase-1.3-monaco-editor
git checkout -b phase-1.4-file-watching
```

### Tasks

#### Task 1.4.1: Install Chokidar

```bash
pnpm add chokidar
pnpm add -D @types/chokidar
```

#### Task 1.4.2: Create File Watcher Service

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

#### Task 1.4.3: Integrate with App

**File**: `app/layout.tsx` (or initialization file)

```typescript
// Start file watcher on app startup
import { fileWatcher } from '@/lib/watchers/file-watcher'

// In server component or API route initialization
fileWatcher.start()
```

**Note**: File watcher will be used in Phase 3 for search index updates. See `docs/plans/GAPS-AND-ADDITIONS.md` lines 418-492 for complete implementation.

### Testing Checklist

- [ ] File watcher starts without errors
- [ ] Detects file additions
- [ ] Detects file modifications
- [ ] Detects file deletions
- [ ] Does not watch dotfiles
- [ ] Can be stopped cleanly

### Commit

```bash
git add .
git commit -m "phase-1.4: Add file system watching with Chokidar

- Install chokidar for file watching
- Create FileWatcherService with event emitter
- Start watcher on app initialization
- Prepare for search index integration in Phase 3"

git push -u origin phase-1.4-file-watching
```

---

## ✅ Phase 1 Completion

### Final Integration

```bash
# Merge all subphases into phase-1
git checkout phase-1-core-foundation
git merge phase-1.1-project-setup
git merge phase-1.2-file-browser
git merge phase-1.3-monaco-editor
git merge phase-1.4-file-watching

# Final testing
pnpm type-check
pnpm lint
pnpm test

# Push phase-1 branch
git push -u origin phase-1-core-foundation
```

### Phase 1 Acceptance Criteria

✅ **Functionality**:
- [ ] Next.js app running on localhost:3000
- [ ] File browser displays `~/.claude/` directory tree
- [ ] Can expand/collapse directories
- [ ] Can select and open files
- [ ] Monaco Editor loads with syntax highlighting
- [ ] Can edit file content
- [ ] Auto-save works (2s debounce)
- [ ] Manual save works (Cmd/Ctrl+S)
- [ ] Changes persist to filesystem
- [ ] Toast notifications for save status

✅ **Code Quality**:
- [ ] TypeScript strict mode passing
- [ ] ESLint passing with no warnings
- [ ] Prettier formatting consistent
- [ ] No console errors
- [ ] Proper error handling

✅ **Documentation**:
- [ ] Code comments for complex logic
- [ ] README with setup instructions
- [ ] Environment variables documented

### Update Master Plan

**File**: `docs/plans/MASTER-PLAN.md`

Update the status table:

```markdown
| **Phase 1**: Core Foundation | 🟢 Completed | phase-1-core-foundation | 2025-11-03 | 2025-11-XX | [→ Phase 1](./phase-1-core-foundation.md) |
```

### Create Pull Request

```bash
# From phase-1-core-foundation branch
gh pr create \
  --title "Phase 1: Core Foundation" \
  --body "Implements core foundation with file browser and Monaco editor.

**Completed**:
- ✅ Next.js project setup with TypeScript
- ✅ File browser for ~/.claude/
- ✅ Monaco Editor integration
- ✅ File read/write API
- ✅ Auto-save functionality

**Testing**: All acceptance criteria met

**Next**: Phase 2 - Skills & Plugins" \
  --base main
```

### Celebrate! 🎉

Phase 1 complete! Ready for Phase 2.

---

**Next Phase**: [Phase 2 - Skills & Plugins](./phase-2-skills-plugins.md)
