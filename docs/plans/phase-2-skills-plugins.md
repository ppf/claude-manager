# Phase 2: Skills & Plugins Management

**Duration**: Week 3-4 (10-14 days)
**Branch**: `phase-2-skills-plugins`
**Status**: 🔴 Not Started
**Prerequisites**: Phase 1 completed

---

## 📊 Phase Status

| Subphase | Status | Started | Completed | Branch |
|----------|--------|---------|-----------|--------|
| 2.1 Skills Browser | 🔴 Not Started | - | - | phase-2.1-skills-browser |
| 2.2 Skills Editor | 🔴 Not Started | - | - | phase-2.2-skills-editor |
| 2.3 Plugins Manager | 🔴 Not Started | - | - | phase-2.3-plugins-manager |

---

## 🎯 Phase Goal

Implement complete skills and plugins management:
- Browse local and marketplace skills
- Install/uninstall skills from marketplace
- Create and edit custom skills
- Enable/disable skills
- Manage plugins (install, configure, update, remove)
- Git operations for skills repositories

**Success Criteria**:
✅ Can browse all skills (local + marketplace)
✅ Can install skills from marketplace (git clone)
✅ Can create new skills from templates
✅ Can edit skill files
✅ Can enable/disable skills
✅ Can manage plugins completely
✅ Git operations work correctly

---

## 📋 Prerequisites

- [ ] Phase 1 completed and merged
- [ ] Current branch is `main` or `phase-1-core-foundation`
- [ ] All Phase 1 tests passing
- [ ] Working directory clean

---

## 🌳 Subphase 2.1: Skills Browser (3-4 days)

**Goal**: Display local skills, fetch marketplace, install/uninstall

### Branch Management

```bash
git checkout -b phase-2-skills-plugins
git checkout -b phase-2.1-skills-browser
```

### Tasks

#### Task 2.1.1: Create Git Manager

**File**: `lib/git/git-manager.ts`

```typescript
import simpleGit, { SimpleGit } from 'simple-git'
import path from 'path'
import { CLAUDE_PATHS } from '@/lib/claude/paths'

const git: SimpleGit = simpleGit()

export interface GitRepository {
  url: string
  branch?: string
  directory: string
}

export async function cloneRepository(repo: GitRepository): Promise<void> {
  const targetPath = path.join(CLAUDE_PATHS.SKILLS, repo.directory)

  try {
    await git.clone(repo.url, targetPath, [
      repo.branch ? `--branch=${repo.branch}` : '',
    ].filter(Boolean))
  } catch (error: any) {
    // Detect authentication errors (see GAPS-AND-ADDITIONS.md Task 2.1.7)
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

// Git authentication help dialog available in components/skills/GitAuthHelp.tsx
// Shows setup instructions for SSH keys, personal access tokens, and credential helpers

export async function pullRepository(directory: string): Promise<void> {
  const repoPath = path.join(CLAUDE_PATHS.SKILLS, directory)
  await git.cwd(repoPath).pull()
}

export async function getRepositoryInfo(directory: string) {
  const repoPath = path.join(CLAUDE_PATHS.SKILLS, directory)
  const repo = git.cwd(repoPath)

  const [remotes, branch, log] = await Promise.all([
    repo.getRemotes(true),
    repo.branch(),
    repo.log({ maxCount: 1 }),
  ])

  return {
    remotes,
    currentBranch: branch.current,
    latestCommit: log.latest,
  }
}

export async function isGitRepository(directory: string): Promise<boolean> {
  try {
    const repoPath = path.join(CLAUDE_PATHS.SKILLS, directory)
    await git.cwd(repoPath).checkIsRepo()
    return true
  } catch {
    return false
  }
}
```

#### Task 2.1.2: Create Skills Service

**File**: `lib/api/skills-service.ts`

```typescript
import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import { CLAUDE_PATHS } from '@/lib/claude/paths'
import type { Skill } from '@/types/claude-config'
import { isGitRepository, getRepositoryInfo } from '@/lib/git/git-manager'

export async function getLocalSkills(): Promise<Skill[]> {
  try {
    const skillsDir = CLAUDE_PATHS.SKILLS
    const entries = await fs.readdir(skillsDir, { withFileTypes: true })

    const skills: Skill[] = []

    for (const entry of entries) {
      if (!entry.isDirectory()) continue

      const skillPath = path.join(skillsDir, entry.name)
      const skillFile = path.join(skillPath, 'SKILL.md')

      try {
        const content = await fs.readFile(skillFile, 'utf-8')
        const { data, content: skillContent } = matter(content)

        const isGit = await isGitRepository(entry.name)

        skills.push({
          id: entry.name,
          name: data.name || entry.name,
          description: data.description || '',
          path: skillPath,
          enabled: data.enabled !== false,
          source: isGit ? 'marketplace' : 'local',
          version: data.version,
          author: data.author,
        })
      } catch (error) {
        // Skip invalid skills
        console.warn(`Invalid skill: ${entry.name}`, error)
      }
    }

    return skills
  } catch (error) {
    console.error('Failed to read skills:', error)
    return []
  }
}

export async function getMarketplaceSkills(): Promise<Skill[]> {
  // Marketplace integration using adapter pattern
  // See GAPS-AND-ADDITIONS.md Task 2.1.6 for complete implementation
  
  const adapter = getMarketplaceAdapter() // Based on MARKETPLACE_TYPE env
  
  try {
    return await adapter.fetchSkills()
  } catch (error) {
    console.error('Failed to fetch marketplace skills:', error)
    // Return cached data or empty array
    return []
  }
}

// Marketplace adapter interface (from GAPS-AND-ADDITIONS.md)
// - Supports GitHub org, API endpoint, or file-based registry
// - 24-hour cache TTL (configurable via MARKETPLACE_CACHE_TTL)
// - Offline mode with cached data
// - See lib/marketplace/adapter-interface.ts for full implementation

export async function installSkill(skillId: string, gitUrl: string): Promise<void> {
  const { cloneRepository } = await import('@/lib/git/git-manager')
  await cloneRepository({
    url: gitUrl,
    directory: skillId,
  })
}

export async function uninstallSkill(skillId: string): Promise<void> {
  const skillPath = path.join(CLAUDE_PATHS.SKILLS, skillId)
  await fs.rm(skillPath, { recursive: true, force: true })
}

export async function toggleSkill(skillId: string, enabled: boolean): Promise<void> {
  const skillPath = path.join(CLAUDE_PATHS.SKILLS, skillId, 'SKILL.md')
  const content = await fs.readFile(skillPath, 'utf-8')
  const { data, content: skillContent } = matter(content)

  data.enabled = enabled

  const updated = matter.stringify(skillContent, data)
  await fs.writeFile(skillPath, updated, 'utf-8')
}
```

#### Task 2.1.3: Create Skills API Routes

**File**: `app/api/skills/route.ts`

```typescript
import { NextRequest } from 'next/server'
import { getLocalSkills, getMarketplaceSkills } from '@/lib/api/skills-service'
import { successResponse, errorResponse } from '@/lib/api/response'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const source = searchParams.get('source') // 'local' | 'marketplace' | 'all'

    let skills = []

    if (source === 'marketplace') {
      skills = await getMarketplaceSkills()
    } else if (source === 'local') {
      skills = await getLocalSkills()
    } else {
      const [local, marketplace] = await Promise.all([
        getLocalSkills(),
        getMarketplaceSkills(),
      ])
      skills = [...local, ...marketplace]
    }

    return successResponse(skills)
  } catch (error) {
    console.error('Error fetching skills:', error)
    return errorResponse({
      type: 'unknown',
      message: 'Failed to fetch skills',
      recoverable: true,
    })
  }
}
```

**File**: `app/api/skills/[id]/route.ts`

```typescript
import { NextRequest } from 'next/server'
import {
  installSkill,
  uninstallSkill,
  toggleSkill,
} from '@/lib/api/skills-service'
import { successResponse, errorResponse } from '@/lib/api/response'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { action, gitUrl, enabled } = await request.json()

    if (action === 'install') {
      await installSkill(params.id, gitUrl)
      return successResponse({ message: 'Skill installed successfully' })
    }

    if (action === 'toggle') {
      await toggleSkill(params.id, enabled)
      return successResponse({ message: 'Skill updated successfully' })
    }

    return errorResponse({
      type: 'validation',
      message: 'Invalid action',
      recoverable: true,
    }, 400)
  } catch (error) {
    console.error('Error managing skill:', error)
    return errorResponse({
      type: 'unknown',
      message: error instanceof Error ? error.message : 'Operation failed',
      recoverable: true,
    })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await uninstallSkill(params.id)
    return successResponse({ message: 'Skill uninstalled successfully' })
  } catch (error) {
    console.error('Error uninstalling skill:', error)
    return errorResponse({
      type: 'filesystem',
      message: 'Failed to uninstall skill',
      recoverable: false,
    })
  }
}
```

#### Task 2.1.4: Create Skills UI Components

**File**: `components/skills/SkillCard.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Download, Trash2, Power } from 'lucide-react'
import { toast } from 'sonner'
import type { Skill } from '@/types/claude-config'

interface SkillCardProps {
  skill: Skill
  onUpdate: () => void
}

export function SkillCard({ skill, onUpdate }: SkillCardProps) {
  const [isLoading, setIsLoading] = useState(false)

  async function handleInstall() {
    try {
      setIsLoading(true)
      // TODO: Get git URL from marketplace
      const gitUrl = `https://github.com/example/${skill.id}.git`

      const response = await fetch(`/api/skills/${skill.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'install', gitUrl }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Skill installed successfully')
        onUpdate()
      } else {
        toast.error(result.error?.message || 'Failed to install skill')
      }
    } catch (error) {
      toast.error('Failed to install skill')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleUninstall() {
    if (!confirm(`Uninstall skill "${skill.name}"?`)) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/skills/${skill.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Skill uninstalled successfully')
        onUpdate()
      } else {
        toast.error(result.error?.message || 'Failed to uninstall skill')
      }
    } catch (error) {
      toast.error('Failed to uninstall skill')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleToggle() {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/skills/${skill.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', enabled: !skill.enabled }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(skill.enabled ? 'Skill disabled' : 'Skill enabled')
        onUpdate()
      } else {
        toast.error(result.error?.message || 'Failed to update skill')
      }
    } catch (error) {
      toast.error('Failed to update skill')
    } finally {
      setIsLoading(false)
    }
  }

  const isInstalled = skill.source === 'local' || skill.path !== ''

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{skill.name}</span>
          {skill.enabled && (
            <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">
              Enabled
            </span>
          )}
        </CardTitle>
        <CardDescription>{skill.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          {!isInstalled ? (
            <Button onClick={handleInstall} disabled={isLoading} size="sm">
              <Download className="h-4 w-4 mr-2" />
              Install
            </Button>
          ) : (
            <>
              <Button
                onClick={handleToggle}
                disabled={isLoading}
                variant={skill.enabled ? 'outline' : 'default'}
                size="sm"
              >
                <Power className="h-4 w-4 mr-2" />
                {skill.enabled ? 'Disable' : 'Enable'}
              </Button>
              <Button
                onClick={handleUninstall}
                disabled={isLoading}
                variant="destructive"
                size="sm"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Uninstall
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

#### Task 2.1.5: Create Skills Page

**File**: `app/skills/page.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { SkillCard } from '@/components/skills/SkillCard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Skill } from '@/types/claude-config'

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchSkills()
  }, [])

  async function fetchSkills() {
    try {
      setIsLoading(true)
      const response = await fetch('/api/skills?source=all')
      const result = await response.json()

      if (result.success) {
        setSkills(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch skills:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const localSkills = skills.filter((s) => s.source === 'local' || s.path !== '')
  const marketplaceSkills = skills.filter((s) => s.source === 'marketplace' && s.path === '')

  if (isLoading) {
    return <div className="p-8">Loading skills...</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Skills</h1>

      <Tabs defaultValue="installed">
        <TabsList>
          <TabsTrigger value="installed">Installed ({localSkills.length})</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace ({marketplaceSkills.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="installed" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {localSkills.map((skill) => (
              <SkillCard key={skill.id} skill={skill} onUpdate={fetchSkills} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="marketplace" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {marketplaceSkills.map((skill) => (
              <SkillCard key={skill.id} skill={skill} onUpdate={fetchSkills} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

### Git Authentication Handling

**Important**: Private repository clones require authentication. The app detects auth errors and provides helpful guidance.

**Implementation**: See `docs/plans/GAPS-AND-ADDITIONS.md` Task 2.1.7 for:
- GitAuthError class for authentication failures
- GitAuthHelpDialog component with setup instructions
- Support for SSH keys, personal access tokens, and credential helpers

### Testing Checklist

- [ ] Skills page loads and displays skills
- [ ] Can view installed and marketplace skills separately
- [ ] Can install skill from marketplace (git clone works)
- [ ] Can uninstall skill (directory removed)
- [ ] Can enable/disable skill (frontmatter updated)
- [ ] Git operations work correctly
- [ ] Error handling for git failures (including auth errors)
- [ ] Auth help dialog shows clear instructions
- [ ] TypeScript compiles without errors

### Commit

```bash
git add .
git commit -m "phase-2.1: Implement skills browser and management

- Create git manager for repository operations
- Add skills service (local + marketplace)
- Build skills API routes
- Create SkillCard component
- Add skills page with tabs
- Implement install/uninstall/toggle functionality"

git push -u origin phase-2.1-skills-browser
```

---

## 🌳 Subphase 2.2: Skills Editor (2-3 days)

**Goal**: Edit skill files, create new skills from templates

### Environment Configuration

**Required env variables** (add to `.env.local`):
```bash
# Marketplace Configuration
MARKETPLACE_TYPE=github                  # github | api | file
MARKETPLACE_GITHUB_ORG=claude-skills     # GitHub organization for skills
MARKETPLACE_CACHE_TTL=86400              # Cache TTL in seconds (24 hours)
```

**See `docs/ENV.md` for complete environment variable documentation.**

### Tasks Summary

- Create skill templates (SKILL.md boilerplate)
- Build skill creation wizard
- Implement skill file editor (reuse Monaco from Phase 1)
- Add skill metadata editor
- Create skill validation

**Files to Create**:
- `lib/templates/skill-template.ts`
- `components/skills/CreateSkillDialog.tsx`
- `app/skills/[id]/page.tsx`
- `app/api/skills/create/route.ts`

**Note**: The `enabled` field in SKILL.md frontmatter is a project-level flag that determines whether Claude Code loads the skill.

---

## 🌳 Subphase 2.3: Plugins Manager (2-3 days)

**Goal**: Complete plugins management UI

### Tasks Summary

- Create plugins service
- Build plugins API routes
- Add plugins UI components
- Implement plugin configuration editor
- Add install/update/remove functionality

**Files to Create**:
- `lib/api/plugins-service.ts`
- `app/api/plugins/route.ts`
- `components/plugins/PluginCard.tsx`
- `app/plugins/page.tsx`

---

## ✅ Phase 2 Completion

Update **MASTER-PLAN.md** status table after completion.

**Next Phase**: [Phase 3 - Search & MCP](./phase-3-search-mcp.md)
