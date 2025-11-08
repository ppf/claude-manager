import { upsertDocument, clearIndex, removeDocument } from './search-index'
import { getLocalSkills } from '@/lib/api/skills-service'
import { readDirectory, readFile } from '@/lib/api/filesystem'
import { CLAUDE_HOME, CLAUDE_PATHS } from '@/lib/claude/paths'
import { fileWatcher, type FileChangeEvent } from '@/lib/watchers/file-watcher'
import type { FileTreeNode } from '@/types/claude-config'
import fs from 'fs/promises'
import path from 'path'

// Debounce queue for incremental updates
const indexUpdateQueue: Set<string> = new Set()
let indexUpdateTimeout: NodeJS.Timeout | null = null
let watcherStarted = false

/**
 * Index all config files from ~/.claude/
 */
export async function indexConfigs(): Promise<number> {
  let count = 0

  try {
    const tree = await readDirectory('')
    
    async function indexNode(nodes: FileTreeNode[]) {
      for (const node of nodes) {
        if (node.type === 'file') {
          try {
            const file = await readFile(node.path)
            
            // Skip very large files (>1MB)
            if (file.size > 1024 * 1024) continue

            upsertDocument({
              id: `config:${node.path}`,
              type: 'config',
              title: file.name,
              path: node.path,
              body: file.content,
            })
            count++
          } catch (error) {
            console.warn(`Failed to index config file ${node.path}:`, error)
          }
        } else if (node.type === 'directory' && node.children) {
          await indexNode(node.children)
        }
      }
    }

    await indexNode(tree)
  } catch (error) {
    console.error('Failed to index configs:', error)
  }

  return count
}

/**
 * Index all skills
 */
export async function indexSkills(): Promise<number> {
  let count = 0

  try {
    const skills = await getLocalSkills()

    for (const skill of skills) {
      try {
        // Read SKILL.md content
        const skillFile = path.join(skill.path, 'SKILL.md')
        const content = await fs.readFile(skillFile, 'utf-8')

        upsertDocument({
          id: `skill:${skill.id}`,
          type: 'skill',
          title: skill.name,
          path: skill.path,
          body: `${skill.description}\n\n${content}`,
        })
        count++
      } catch (error) {
        console.warn(`Failed to index skill ${skill.id}:`, error)
      }
    }
  } catch (error) {
    console.error('Failed to index skills:', error)
  }

  return count
}

/**
 * Index plugins (skills with commands)
 */
export async function indexPlugins(): Promise<number> {
  let count = 0

  try {
    const skills = await getLocalSkills()
    const plugins = skills.filter((s) => s.hasCommands)

    for (const plugin of plugins) {
      try {
        const skillFile = path.join(plugin.path, 'SKILL.md')
        const content = await fs.readFile(skillFile, 'utf-8')

        const commandsList = plugin.commands?.join(', ') || ''

        upsertDocument({
          id: `plugin:${plugin.id}`,
          type: 'plugin',
          title: plugin.name,
          path: plugin.path,
          body: `Commands: ${commandsList}\n\n${plugin.description}\n\n${content}`,
        })
        count++
      } catch (error) {
        console.warn(`Failed to index plugin ${plugin.id}:`, error)
      }
    }
  } catch (error) {
    console.error('Failed to index plugins:', error)
  }

  return count
}

/**
 * Index MCP servers from config file
 */
export async function indexMCP(): Promise<number> {
  let count = 0

  try {
    const configPath = CLAUDE_PATHS.MCP_CONFIG
    const content = await fs.readFile(configPath, 'utf-8')
    const config = JSON.parse(content)

    if (config.mcpServers && typeof config.mcpServers === 'object') {
      for (const [id, server] of Object.entries(config.mcpServers)) {
        const serverConfig = server as Record<string, unknown>

        upsertDocument({
          id: `mcp:${id}`,
          type: 'mcp',
          title: id,
          path: configPath,
          body: `${serverConfig.command || ''} ${Array.isArray(serverConfig.args) ? serverConfig.args.join(' ') : ''}\n${JSON.stringify(serverConfig.env || {})}`,
        })
        count++
      }
    }
  } catch (error) {
    // MCP config might not exist yet, that's okay
    console.warn('Failed to index MCP servers:', error)
  }

  return count
}

/**
 * Rebuild entire search index
 */
export async function rebuildSearchIndex(): Promise<void> {
  console.log('Rebuilding search index...')
  
  const startTime = Date.now()
  
  // Clear existing index
  clearIndex()

  // Index all resources in parallel
  const [configCount, skillCount, pluginCount, mcpCount] = await Promise.all([
    indexConfigs(),
    indexSkills(),
    indexPlugins(),
    indexMCP(),
  ])

  const duration = Date.now() - startTime
  
  console.log(`Search index rebuilt in ${duration}ms:`)
  console.log(`  - ${configCount} config files`)
  console.log(`  - ${skillCount} skills`)
  console.log(`  - ${pluginCount} plugins`)
  console.log(`  - ${mcpCount} MCP servers`)
}

/**
 * Update index for a specific file
 */
async function updateIndexForFile(filePath: string): Promise<void> {
  try {
    // Determine file type based on path
    const relativePath = path.relative(CLAUDE_HOME, filePath)
    
    if (relativePath.startsWith('skills/')) {
      // Re-index all skills (simpler than determining which skill changed)
      await indexSkills()
      await indexPlugins()
    } else if (relativePath === 'mcp-servers.json') {
      await indexMCP()
    } else {
      // Regular config file
      try {
        const file = await readFile(relativePath)
        
        if (file.size <= 1024 * 1024) {
          upsertDocument({
            id: `config:${relativePath}`,
            type: 'config',
            title: file.name,
            path: relativePath,
            body: file.content,
          })
        }
      } catch {
        // File might have been deleted
        removeDocument(`config:${relativePath}`)
      }
    }
  } catch (error) {
    console.warn(`Failed to update index for ${filePath}:`, error)
  }
}

/**
 * Queue a file for index update (debounced)
 */
function queueIndexUpdate(filePath: string): void {
  indexUpdateQueue.add(filePath)

  if (indexUpdateTimeout) {
    clearTimeout(indexUpdateTimeout)
  }

  indexUpdateTimeout = setTimeout(() => {
    processIndexQueue()
  }, 1000) // 1 second debounce
}

/**
 * Process queued index updates
 */
async function processIndexQueue(): Promise<void> {
  const paths = Array.from(indexUpdateQueue)
  indexUpdateQueue.clear()

  for (const filePath of paths) {
    await updateIndexForFile(filePath)
  }
}

/**
 * Start watching for file changes
 */
export function startIncrementalIndexing(): void {
  if (watcherStarted) return

  fileWatcher.start()
  
  fileWatcher.on('change', (event: FileChangeEvent) => {
    if (event.type === 'unlink') {
      const relativePath = path.relative(CLAUDE_HOME, event.path)
      removeDocument(`config:${relativePath}`)
    } else {
      queueIndexUpdate(event.path)
    }
  })

  watcherStarted = true
  console.log('Incremental search indexing started')
}

