# Phase 2.3: Plugins Manager (Detailed Specification)

**Duration**: 4-6 hours (Simplified Implementation)
**Branch**: `phase-2.3-plugins-manager`
**Status**: 🟢 Completed
**Prerequisites**: Phase 2.2 completed, Phase 0 plugin research complete

---

## ✅ IMPLEMENTATION COMPLETE

**Decision**: Scenario B - Simplified Implementation (Plugins = Skills with Commands)

Based on Phase 0.3 research, plugins and skills use the same infrastructure in Claude Code. Implementation reuses existing skills system with command detection.

**Decision Document**: `docs/research/plugin-implementation-decision.md`

---

## 📊 Phase Status

| Task | Status | Started | Completed |
|------|--------|---------|-----------|
| 2.3.0 Plugin System Research Review | 🟢 Completed | 2025-11-08 | 2025-11-08 |
| 2.3.1 Plugin Service Layer | 🟢 Completed | 2025-11-08 | 2025-11-08 |
| 2.3.2 Plugin API Routes | 🟢 Completed | 2025-11-08 | 2025-11-08 |
| 2.3.3 Plugin Card Component | 🟢 Completed | 2025-11-08 | 2025-11-08 |
| 2.3.4 Plugin Configuration Dialog | ⏭️ Skipped | - | - |
| 2.3.5 Plugins Page | 🟢 Completed | 2025-11-08 | 2025-11-08 |

---

## 🎯 Phase Goal

**Actual Implementation**: Simplified plugins management leveraging existing skills infrastructure

**What Was Built**:
- ✅ Plugins page with tabs (Command Skills / All Skills / Auto Skills)
- ✅ Command detection in skills (`detectCommands()` helper)
- ✅ Plugin filtering via API (`?type=plugin`)
- ✅ Visual badges for commands
- ✅ Reused existing skills management (toggle, delete)
- ✅ Info alert explaining plugin = skill relationship

**Success Criteria Achieved**:
- ✅ Can list installed skills with commands
- ✅ Can filter command skills vs auto skills
- ✅ Can enable/disable plugins (via skills toggle)
- ✅ Can remove plugins (via skills delete)
- ✅ Commands are detected and displayed
- ✅ Links to full skills management

**Time Saved**: ~1.5 days (4-6 hours vs 2-3 days)

---

## 📝 Implementation Summary

### Files Created
- `app/plugins/page.tsx` - Main plugins page with tabs
- `components/plugins/PluginCard.tsx` - Card component with command badges
- `docs/research/plugin-implementation-decision.md` - Implementation decision doc

### Files Modified
- `types/claude-config.ts` - Added `hasCommands`, `commands`, `tags` to Skill interface
- `lib/api/skills-service.ts` - Added `detectCommands()` helper
- `app/api/skills/route.ts` - Added `type` query parameter filter
- `docs/plans/MASTER-PLAN.md` - Updated Phase 2 completion status

### Key Technical Decisions
1. **No separate plugin infrastructure** - Reuse skills system
2. **Command detection** - Parse skill content for `/command` patterns
3. **API filtering** - Add query param instead of new endpoints
4. **UI differentiation** - Show command badges and separate tabs

---

## 🎯 Original Phase Goal (Modified Based on Research)

## 📋 Task 2.3.0: Plugin System Research Review

**Goal**: Review Phase 0.3 findings and decide implementation approach

### Decision Matrix

Based on Phase 0.3 findings, choose approach:

#### **Scenario A: Full Plugin System Exists**
```yaml
Indicators:
  - ~/.claude/plugins/ directory exists
  - `claude plugin` commands work
  - Plugin config file found
  - Example plugins exist

Action: Proceed with full implementation (Tasks 2.3.1-2.3.5)
Timeline: 2-3 days
```

#### **Scenario B: Partial Plugin Support**
```yaml
Indicators:
  - Plugin structure defined but no marketplace
  - Manual installation only
  - Limited CLI support

Action: Implement basic management, skip marketplace features
Timeline: 1-2 days
```

#### **Scenario C: No Plugin System Yet**
```yaml
Indicators:
  - No plugin directory
  - No CLI commands
  - No documentation

Action: Create stub/placeholder UI, defer full implementation
Timeline: 2-3 hours
```

### Create Decision Document

**File**: `docs/research/plugin-implementation-decision.md`

```markdown
# Plugin Implementation Decision

**Date**: [Date]
**Based on**: Phase 0.3 Research

## Findings Summary
[Copy from Phase 0.3 research]

## Decision
- [ ] Scenario A: Full Implementation
- [ ] Scenario B: Partial Implementation  
- [ ] Scenario C: Defer to Post-MVP

## Rationale
[Why this decision was made]

## Implementation Plan
[Tasks to complete based on scenario]

## Plugin Configuration
- **Config location**: [Where plugin config is stored]
- **Schema-driven dialog**: Dynamic form generation from JSON Schema
- **Persistence**: Plugin config stored in `~/.claude/plugins/{plugin-id}/config.json`

## Timeline Impact
[How this affects overall schedule]
```

---

## 📋 Task 2.3.1: Plugin Service Layer

**Goal**: Create service layer for plugin operations

**Note**: Implementation depends on actual plugin system structure

### Plugin Type Definitions

**File**: `types/plugin.ts`

```typescript
export interface Plugin {
  id: string
  name: string
  version: string
  description: string
  author: string
  homepage?: string
  repository?: string
  license?: string
  enabled: boolean
  installed: boolean
  installedVersion?: string
  availableVersion?: string
  config?: PluginConfig
  configSchema?: PluginConfigSchema
  dependencies?: string[]
  tags?: string[]
  category?: string
  installedAt?: Date
  updatedAt?: Date
}

export interface PluginConfig {
  [key: string]: any
}

export interface PluginConfigSchema {
  type: 'object'
  properties: {
    [key: string]: {
      type: string
      title?: string
      description?: string
      default?: any
      enum?: any[]
      minimum?: number
      maximum?: number
      pattern?: string
      required?: boolean
    }
  }
  required?: string[]
}

export interface PluginManifest {
  name: string
  version: string
  description: string
  author: string
  main?: string
  config?: PluginConfigSchema
  dependencies?: string[]
}
```

### Plugin Service

**File**: `lib/api/plugins-service.ts`

```typescript
import fs from 'fs/promises'
import path from 'path'
import { CLAUDE_PATHS } from '@/lib/claude/paths'
import type { Plugin, PluginManifest, PluginConfig } from '@/types/plugin'

// NOTE: This is a TEMPLATE - adjust based on actual plugin system structure

export async function getInstalledPlugins(): Promise<Plugin[]> {
  try {
    const pluginsDir = path.join(CLAUDE_PATHS.PLUGINS || '~/.claude/plugins')
    
    // Check if plugins directory exists
    try {
      await fs.access(pluginsDir)
    } catch {
      return [] // No plugins directory yet
    }

    const entries = await fs.readdir(pluginsDir, { withFileTypes: true })
    const plugins: Plugin[] = []

    for (const entry of entries) {
      if (!entry.isDirectory()) continue

      const pluginPath = path.join(pluginsDir, entry.name)
      
      try {
        const manifest = await readPluginManifest(pluginPath)
        const config = await readPluginConfig(pluginPath)
        
        plugins.push({
          id: entry.name,
          name: manifest.name || entry.name,
          version: manifest.version || '0.0.0',
          description: manifest.description || '',
          author: manifest.author || 'Unknown',
          enabled: config?.enabled !== false,
          installed: true,
          installedVersion: manifest.version,
          config: config || {},
          configSchema: manifest.config,
          dependencies: manifest.dependencies,
        })
      } catch (error) {
        console.warn(`Invalid plugin: ${entry.name}`, error)
      }
    }

    return plugins
  } catch (error) {
    console.error('Failed to read plugins:', error)
    return []
  }
}

async function readPluginManifest(pluginPath: string): Promise<PluginManifest> {
  // Try multiple manifest file names
  const possibleFiles = ['plugin.json', 'manifest.json', 'package.json']
  
  for (const filename of possibleFiles) {
    try {
      const content = await fs.readFile(path.join(pluginPath, filename), 'utf-8')
      return JSON.parse(content)
    } catch {
      continue
    }
  }
  
  throw new Error('No manifest file found')
}

async function readPluginConfig(pluginPath: string): Promise<PluginConfig | null> {
  try {
    const content = await fs.readFile(path.join(pluginPath, 'config.json'), 'utf-8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

export async function getAvailablePlugins(): Promise<Plugin[]> {
  // NOTE: Replace with actual marketplace API
  // This is a stub implementation
  
  try {
    // Option 1: Fetch from API
    // const response = await fetch('https://api.claude.com/plugins')
    // const data = await response.json()
    // return data.plugins
    
    // Option 2: Read from registry file
    // const registryPath = path.join(CLAUDE_PATHS.HOME, 'plugin-registry.json')
    // const content = await fs.readFile(registryPath, 'utf-8')
    // return JSON.parse(content).plugins
    
    // Option 3: Hardcoded list (for testing)
    return [
      {
        id: 'example-plugin',
        name: 'Example Plugin',
        version: '1.0.0',
        description: 'An example plugin',
        author: 'Claude Team',
        enabled: false,
        installed: false,
        availableVersion: '1.0.0',
      },
    ]
  } catch (error) {
    console.error('Failed to fetch available plugins:', error)
    return []
  }
}

export async function installPlugin(pluginId: string, source?: string): Promise<void> {
  // NOTE: Adjust based on actual installation mechanism
  
  const pluginsDir = path.join(CLAUDE_PATHS.PLUGINS || '~/.claude/plugins')
  const pluginPath = path.join(pluginsDir, pluginId)
  
  // Ensure plugins directory exists
  await fs.mkdir(pluginsDir, { recursive: true })
  
  // Installation methods (choose based on actual system):
  
  // Method 1: Download from URL
  if (source && source.startsWith('http')) {
    // Download and extract
    // Implementation depends on package format (.zip, .tar.gz, etc.)
  }
  
  // Method 2: Git clone
  if (source && source.includes('git')) {
    const { cloneRepository } = await import('@/lib/git/git-manager')
    await cloneRepository({
      url: source,
      directory: pluginPath,
    })
  }
  
  // Method 3: npm install
  if (!source) {
    const { exec } = await import('child_process')
    await new Promise((resolve, reject) => {
      exec(`npm install ${pluginId}`, { cwd: pluginsDir }, (error) => {
        if (error) reject(error)
        else resolve(null)
      })
    })
  }
  
  // Create default config
  const defaultConfig = { enabled: true }
  await fs.writeFile(
    path.join(pluginPath, 'config.json'),
    JSON.stringify(defaultConfig, null, 2),
    'utf-8'
  )
}

export async function uninstallPlugin(pluginId: string): Promise<void> {
  const pluginsDir = path.join(CLAUDE_PATHS.PLUGINS || '~/.claude/plugins')
  const pluginPath = path.join(pluginsDir, pluginId)
  
  await fs.rm(pluginPath, { recursive: true, force: true })
}

export async function updatePluginConfig(
  pluginId: string,
  config: PluginConfig
): Promise<void> {
  const pluginsDir = path.join(CLAUDE_PATHS.PLUGINS || '~/.claude/plugins')
  const configPath = path.join(pluginsDir, pluginId, 'config.json')
  
  await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8')
}

export async function togglePlugin(pluginId: string, enabled: boolean): Promise<void> {
  const pluginsDir = path.join(CLAUDE_PATHS.PLUGINS || '~/.claude/plugins')
  const configPath = path.join(pluginsDir, pluginId, 'config.json')
  
  let config: PluginConfig = {}
  
  try {
    const content = await fs.readFile(configPath, 'utf-8')
    config = JSON.parse(content)
  } catch {
    // Config doesn't exist, create new
  }
  
  config.enabled = enabled
  
  await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8')
}

export async function updatePlugin(pluginId: string): Promise<void> {
  // NOTE: Implementation depends on installation method
  
  const pluginsDir = path.join(CLAUDE_PATHS.PLUGINS || '~/.claude/plugins')
  const pluginPath = path.join(pluginsDir, pluginId)
  
  // If git repository, pull latest
  try {
    const { pullRepository } = await import('@/lib/git/git-manager')
    await pullRepository(pluginPath)
  } catch {
    // Not a git repo, try other methods
  }
  
  // If npm package, update
  // const { exec } = await import('child_process')
  // await exec(`npm update ${pluginId}`, { cwd: pluginsDir })
}
```

---

## 📋 Task 2.3.2: Plugin API Routes

**Goal**: Create REST API for plugin operations

### List Plugins

**File**: `app/api/plugins/route.ts`

```typescript
import { NextRequest } from 'next/server'
import { getInstalledPlugins, getAvailablePlugins } from '@/lib/api/plugins-service'
import { successResponse, errorResponse } from '@/lib/api/response'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const source = searchParams.get('source') // 'installed' | 'available' | 'all'

    let plugins = []

    if (source === 'available') {
      plugins = await getAvailablePlugins()
    } else if (source === 'installed') {
      plugins = await getInstalledPlugins()
    } else {
      const [installed, available] = await Promise.all([
        getInstalledPlugins(),
        getAvailablePlugins(),
      ])
      
      // Merge lists, marking installed plugins
      const installedIds = new Set(installed.map(p => p.id))
      const merged = [
        ...installed,
        ...available.filter(p => !installedIds.has(p.id)),
      ]
      
      plugins = merged
    }

    return successResponse(plugins)
  } catch (error) {
    console.error('Error fetching plugins:', error)
    return errorResponse({
      type: 'unknown',
      message: 'Failed to fetch plugins',
      recoverable: true,
    })
  }
}
```

### Plugin Operations

**File**: `app/api/plugins/[id]/route.ts`

```typescript
import { NextRequest } from 'next/server'
import {
  installPlugin,
  uninstallPlugin,
  updatePluginConfig,
  togglePlugin,
  updatePlugin,
} from '@/lib/api/plugins-service'
import { successResponse, errorResponse, validationError } from '@/lib/api/response'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { action, config, enabled, source } = await request.json()

    if (action === 'install') {
      await installPlugin(params.id, source)
      return successResponse({ message: 'Plugin installed successfully' })
    }

    if (action === 'toggle') {
      await togglePlugin(params.id, enabled)
      return successResponse({ message: 'Plugin updated successfully' })
    }

    if (action === 'update') {
      await updatePlugin(params.id)
      return successResponse({ message: 'Plugin updated successfully' })
    }

    if (action === 'configure') {
      await updatePluginConfig(params.id, config)
      return successResponse({ message: 'Configuration saved successfully' })
    }

    return validationError('Invalid action')
  } catch (error) {
    console.error('Error managing plugin:', error)
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
    await uninstallPlugin(params.id)
    return successResponse({ message: 'Plugin uninstalled successfully' })
  } catch (error) {
    console.error('Error uninstalling plugin:', error)
    return errorResponse({
      type: 'filesystem',
      message: 'Failed to uninstall plugin',
      recoverable: false,
    })
  }
}
```

---

## 📋 Task 2.3.3: Plugin Card Component

**Goal**: Display plugin information and actions

**File**: `components/plugins/PluginCard.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Download, Trash2, Power, Settings, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import type { Plugin } from '@/types/plugin'

interface PluginCardProps {
  plugin: Plugin
  onUpdate: () => void
  onConfigure?: (plugin: Plugin) => void
}

export function PluginCard({ plugin, onUpdate, onConfigure }: PluginCardProps) {
  const [isLoading, setIsLoading] = useState(false)

  async function handleInstall() {
    try {
      setIsLoading(true)
      
      const response = await fetch(`/api/plugins/${plugin.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'install' }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Plugin installed successfully')
        onUpdate()
      } else {
        toast.error(result.error?.message || 'Failed to install plugin')
      }
    } catch (error) {
      toast.error('Failed to install plugin')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleUninstall() {
    if (!confirm(`Uninstall plugin "${plugin.name}"?`)) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/plugins/${plugin.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Plugin uninstalled successfully')
        onUpdate()
      } else {
        toast.error(result.error?.message || 'Failed to uninstall plugin')
      }
    } catch (error) {
      toast.error('Failed to uninstall plugin')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleToggle() {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/plugins/${plugin.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', enabled: !plugin.enabled }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(plugin.enabled ? 'Plugin disabled' : 'Plugin enabled')
        onUpdate()
      } else {
        toast.error(result.error?.message || 'Failed to update plugin')
      }
    } catch (error) {
      toast.error('Failed to update plugin')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleUpdate() {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/plugins/${plugin.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update' }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Plugin updated successfully')
        onUpdate()
      } else {
        toast.error(result.error?.message || 'Failed to update plugin')
      }
    } catch (error) {
      toast.error('Failed to update plugin')
    } finally {
      setIsLoading(false)
    }
  }

  const hasUpdate = plugin.installed && 
    plugin.installedVersion && 
    plugin.availableVersion &&
    plugin.installedVersion !== plugin.availableVersion

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {plugin.name}
              {plugin.enabled && (
                <Badge variant="default" className="bg-green-500">
                  Enabled
                </Badge>
              )}
              {hasUpdate && (
                <Badge variant="outline">Update Available</Badge>
              )}
            </CardTitle>
            <CardDescription>{plugin.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <span>v{plugin.installed ? plugin.installedVersion : plugin.availableVersion}</span>
          <span>•</span>
          <span>{plugin.author}</span>
          {plugin.category && (
            <>
              <span>•</span>
              <Badge variant="secondary">{plugin.category}</Badge>
            </>
          )}
        </div>
        
        {plugin.tags && plugin.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {plugin.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex gap-2">
        {!plugin.installed ? (
          <Button onClick={handleInstall} disabled={isLoading} size="sm">
            <Download className="h-4 w-4 mr-2" />
            Install
          </Button>
        ) : (
          <>
            <Button
              onClick={handleToggle}
              disabled={isLoading}
              variant={plugin.enabled ? 'outline' : 'default'}
              size="sm"
            >
              <Power className="h-4 w-4 mr-2" />
              {plugin.enabled ? 'Disable' : 'Enable'}
            </Button>
            
            {plugin.configSchema && onConfigure && (
              <Button
                onClick={() => onConfigure(plugin)}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                <Settings className="h-4 w-4 mr-2" />
                Configure
              </Button>
            )}
            
            {hasUpdate && (
              <Button
                onClick={handleUpdate}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Update
              </Button>
            )}
            
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
      </CardFooter>
    </Card>
  )
}
```

---

## 📋 Task 2.3.4: Plugin Configuration Dialog

**Goal**: Dynamic form for plugin configuration

**Note**: This dialog is **schema-driven** - it generates form fields dynamically based on the plugin's `configSchema` (JSON Schema format). This allows plugins to define their own configuration UI without code changes.

**Config Persistence**: Plugin configuration is saved to `~/.claude/plugins/{plugin-id}/config.json`.

**File**: `components/plugins/PluginConfigDialog.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import type { Plugin, PluginConfig } from '@/types/plugin'

interface PluginConfigDialogProps {
  plugin: Plugin | null
  onClose: () => void
  onSave: () => void
}

export function PluginConfigDialog({ plugin, onClose, onSave }: PluginConfigDialogProps) {
  const [config, setConfig] = useState<PluginConfig>(plugin?.config || {})
  const [isSaving, setIsSaving] = useState(false)

  if (!plugin || !plugin.configSchema) return null

  async function handleSave() {
    try {
      setIsSaving(true)
      
      const response = await fetch(`/api/plugins/${plugin.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'configure', config }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Configuration saved')
        onSave()
        onClose()
      } else {
        toast.error('Failed to save configuration')
      }
    } catch (error) {
      toast.error('Failed to save configuration')
    } finally {
      setIsSaving(false)
    }
  }

  function renderField(key: string, schema: any) {
    const value = config[key] ?? schema.default

    switch (schema.type) {
      case 'boolean':
        return (
          <div className="flex items-center justify-between">
            <Label htmlFor={key}>{schema.title || key}</Label>
            <Switch
              id={key}
              checked={value}
              onCheckedChange={(checked) => setConfig({ ...config, [key]: checked })}
            />
          </div>
        )

      case 'number':
      case 'integer':
        return (
          <div>
            <Label htmlFor={key}>{schema.title || key}</Label>
            <Input
              id={key}
              type="number"
              value={value}
              onChange={(e) => setConfig({ ...config, [key]: parseFloat(e.target.value) })}
              min={schema.minimum}
              max={schema.maximum}
            />
            {schema.description && (
              <p className="text-xs text-muted-foreground mt-1">{schema.description}</p>
            )}
          </div>
        )

      case 'string':
        if (schema.enum) {
          return (
            <div>
              <Label htmlFor={key}>{schema.title || key}</Label>
              <Select
                value={value}
                onValueChange={(newValue) => setConfig({ ...config, [key]: newValue })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {schema.enum.map((option: string) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {schema.description && (
                <p className="text-xs text-muted-foreground mt-1">{schema.description}</p>
              )}
            </div>
          )
        }

        if (schema.format === 'textarea') {
          return (
            <div>
              <Label htmlFor={key}>{schema.title || key}</Label>
              <Textarea
                id={key}
                value={value}
                onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
                rows={4}
              />
              {schema.description && (
                <p className="text-xs text-muted-foreground mt-1">{schema.description}</p>
              )}
            </div>
          )
        }

        return (
          <div>
            <Label htmlFor={key}>{schema.title || key}</Label>
            <Input
              id={key}
              value={value}
              onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
              placeholder={schema.placeholder}
            />
            {schema.description && (
              <p className="text-xs text-muted-foreground mt-1">{schema.description}</p>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={!!plugin} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configure {plugin.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {Object.entries(plugin.configSchema.properties).map(([key, schema]) => (
            <div key={key}>{renderField(key, schema)}</div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

---

## 📋 Task 2.3.5: Plugins Page

**Goal**: Main plugins management page

**File**: `app/plugins/page.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { PluginCard } from '@/components/plugins/PluginCard'
import { PluginConfigDialog } from '@/components/plugins/PluginConfigDialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import type { Plugin } from '@/types/plugin'

export default function PluginsPage() {
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [configuring, setConfiguring] = useState<Plugin | null>(null)

  useEffect(() => {
    fetchPlugins()
  }, [])

  async function fetchPlugins() {
    try {
      setIsLoading(true)
      const response = await fetch('/api/plugins?source=all')
      const result = await response.json()

      if (result.success) {
        setPlugins(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch plugins:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const installedPlugins = plugins.filter((p) => p.installed)
  const availablePlugins = plugins.filter((p) => !p.installed)

  const filteredInstalled = installedPlugins.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase())
  )

  const filteredAvailable = availablePlugins.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) {
    return <div className="p-8">Loading plugins...</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Plugins</h1>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search plugins..."
            className="pl-10"
          />
        </div>
      </div>

      <Tabs defaultValue="installed">
        <TabsList>
          <TabsTrigger value="installed">
            Installed ({installedPlugins.length})
          </TabsTrigger>
          <TabsTrigger value="available">
            Available ({availablePlugins.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="installed" className="mt-6">
          {filteredInstalled.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {search ? 'No plugins match your search' : 'No plugins installed yet'}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredInstalled.map((plugin) => (
                <PluginCard
                  key={plugin.id}
                  plugin={plugin}
                  onUpdate={fetchPlugins}
                  onConfigure={setConfiguring}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="available" className="mt-6">
          {filteredAvailable.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {search ? 'No plugins match your search' : 'No plugins available'}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredAvailable.map((plugin) => (
                <PluginCard
                  key={plugin.id}
                  plugin={plugin}
                  onUpdate={fetchPlugins}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <PluginConfigDialog
        plugin={configuring}
        onClose={() => setConfiguring(null)}
        onSave={fetchPlugins}
      />
    </div>
  )
}
```

---

## ✅ Phase 2.3 Completion Checklist

### Research
- [ ] Phase 0.3 findings reviewed
- [ ] Implementation approach decided
- [ ] Decision documented

### Functionality (if implementing)
- [ ] Plugins list loads correctly
- [ ] Can install plugins
- [ ] Can uninstall plugins
- [ ] Can configure plugins
- [ ] Can enable/disable plugins
- [ ] Configuration persists
- [ ] Updates work (if supported)

### Code Quality
- [ ] TypeScript compiles without errors
- [ ] Error handling comprehensive
- [ ] API responses consistent
- [ ] No data loss scenarios

### Testing
- [ ] Test plugin listing
- [ ] Test installation
- [ ] Test configuration with various schemas
- [ ] Test enable/disable
- [ ] Test uninstallation
- [ ] Test error scenarios

---

## 📝 Alternative: Stub Implementation

If plugins don't exist yet, create minimal stub:

**File**: `app/plugins/page.tsx` (stub version)

```typescript
export default function PluginsPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Plugins</h1>
      
      <div className="bg-muted/50 border border-dashed rounded-lg p-12 text-center">
        <h2 className="text-xl font-semibold mb-2">Plugins Coming Soon</h2>
        <p className="text-muted-foreground">
          Plugin management will be available in a future update.
        </p>
      </div>
    </div>
  )
}
```

---

## 📝 Commit

```bash
git add .
git commit -m "phase-2.3: Implement plugins manager

- Create plugin service layer with CRUD operations
- Build plugin API routes
- Add PluginCard component with all actions
- Create dynamic configuration dialog
- Implement plugins page with search and tabs
- Support for install/uninstall/configure/enable/disable
- Handle plugin updates and dependencies"

git push -u origin phase-2.3-plugins-manager
```

---

**Next**: [Phase 3 - Search & MCP](./phase-3-search-mcp.md)
