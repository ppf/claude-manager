import fs from 'fs/promises'
import path from 'path'
import { homedir } from 'os'
import type { MCPServer } from '@/types/claude-config'

/**
 * Claude's MCP configuration system
 * - Global servers: ~/.claude/settings.local.json (enabledMcpjsonServers)
 * - Templates: ~/.claude/mcp-templates/*.mcp.json
 * - Project servers: ~/.claude/projects/[project]/mcp.json (future support)
 */

const CLAUDE_HOME = path.join(homedir(), '.claude')
const SETTINGS_LOCAL_PATH = path.join(CLAUDE_HOME, 'settings.local.json')
const MCP_TEMPLATES_DIR = path.join(CLAUDE_HOME, 'mcp-templates')

export interface ClaudeSettingsLocal {
  permissions?: {
    allow?: string[]
  }
  enableAllProjectMcpServers?: boolean
  enabledMcpjsonServers?: string[]
}

export interface ClaudeMCPConfig {
  mcpServers: Record<
    string,
    {
      command: string
      args?: string[]
      env?: Record<string, string>
      enabled?: boolean
    }
  >
}

export interface MCPConfigScope {
  global: MCPServer[]
  templates: Array<{ name: string; servers: MCPServer[] }>
}

/**
 * Read Claude's settings.local.json
 */
async function readSettingsLocal(): Promise<ClaudeSettingsLocal> {
  try {
    const content = await fs.readFile(SETTINGS_LOCAL_PATH, 'utf-8')
    return JSON.parse(content)
  } catch {
    // File might not exist, return empty config
    return {}
  }
}

/**
 * Write Claude's settings.local.json
 */
async function writeSettingsLocal(settings: ClaudeSettingsLocal): Promise<void> {
  await fs.writeFile(SETTINGS_LOCAL_PATH, JSON.stringify(settings, null, 2), 'utf-8')
}

/**
 * Read MCP template file
 */
async function readMCPTemplate(templateName: string): Promise<ClaudeMCPConfig | null> {
  try {
    const templatePath = path.join(MCP_TEMPLATES_DIR, `${templateName}.mcp.json`)
    const content = await fs.readFile(templatePath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

/**
 * List available MCP templates
 */
async function listMCPTemplates(): Promise<string[]> {
  try {
    const files = await fs.readdir(MCP_TEMPLATES_DIR)
    return files.filter((f) => f.endsWith('.mcp.json')).map((f) => f.replace('.mcp.json', ''))
  } catch {
    return []
  }
}

/**
 * Convert Claude MCP config format to MCPServer format
 */
function convertToMCPServer(
  id: string,
  config: { command: string; args?: string[]; env?: Record<string, string>; enabled?: boolean }
): MCPServer {
  return {
    id,
    name: id,
    command: config.command,
    args: config.args || [],
    env: config.env || {},
    enabled: config.enabled !== false,
  }
}

/**
 * Get all MCP servers from Claude's configuration
 */
export async function readClaudeMCPConfig(): Promise<MCPConfigScope> {
  const result: MCPConfigScope = {
    global: [],
    templates: [],
  }

  // Read enabled servers from settings.local.json
  const settings = await readSettingsLocal()
  const enabledServers = settings.enabledMcpjsonServers || []

  // Load templates and find enabled servers
  const templateNames = await listMCPTemplates()

  for (const templateName of templateNames) {
    const templateConfig = await readMCPTemplate(templateName)
    if (!templateConfig) continue

    const templateServers: MCPServer[] = []

    for (const [serverId, serverConfig] of Object.entries(templateConfig.mcpServers)) {
      const isEnabled = enabledServers.includes(serverId)
      const server = convertToMCPServer(serverId, {
        ...serverConfig,
        enabled: isEnabled,
      })

      templateServers.push(server)

      // If enabled, add to global list
      if (isEnabled) {
        result.global.push(server)
      }
    }

    result.templates.push({
      name: templateName,
      servers: templateServers,
    })
  }

  return result
}

/**
 * Get all enabled MCP servers
 */
export async function getAllClaudeMCPServers(): Promise<MCPServer[]> {
  const config = await readClaudeMCPConfig()
  return config.global
}

/**
 * Get a single MCP server by ID
 */
export async function getClaudeMCPServer(id: string): Promise<MCPServer | null> {
  const config = await readClaudeMCPConfig()
  return config.global.find((s) => s.id === id) || null
}

/**
 * Update MCP server enabled status in settings.local.json
 */
export async function updateClaudeMCPServerStatus(id: string, enabled: boolean): Promise<void> {
  const settings = await readSettingsLocal()

  if (!settings.enabledMcpjsonServers) {
    settings.enabledMcpjsonServers = []
  }

  if (enabled) {
    // Add to enabled list if not already there
    if (!settings.enabledMcpjsonServers.includes(id)) {
      settings.enabledMcpjsonServers.push(id)
    }
  } else {
    // Remove from enabled list
    settings.enabledMcpjsonServers = settings.enabledMcpjsonServers.filter((s) => s !== id)
  }

  await writeSettingsLocal(settings)
}

/**
 * Create a new MCP template with server
 * Note: This creates a new template file, not a runtime server
 */
export async function createClaudeMCPTemplate(
  templateName: string,
  servers: Record<
    string,
    {
      command: string
      args?: string[]
      env?: Record<string, string>
    }
  >
): Promise<void> {
  const templatePath = path.join(MCP_TEMPLATES_DIR, `${templateName}.mcp.json`)

  const config: ClaudeMCPConfig = {
    mcpServers: servers,
  }

  await fs.writeFile(templatePath, JSON.stringify(config, null, 2), 'utf-8')
}

/**
 * Get all available templates with their servers
 */
export async function getAllMCPTemplates(): Promise<
  Array<{ name: string; servers: MCPServer[] }>
> {
  const config = await readClaudeMCPConfig()
  return config.templates
}

/**
 * Check if MCP server exists in any template
 */
export async function mcpServerExists(serverId: string): Promise<boolean> {
  const config = await readClaudeMCPConfig()

  for (const template of config.templates) {
    if (template.servers.some((s) => s.id === serverId)) {
      return true
    }
  }

  return false
}
