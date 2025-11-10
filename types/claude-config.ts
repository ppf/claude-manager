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
  origin?: 'local' | 'marketplace'  // Tracks installation source: 'local' = user-created, 'marketplace' = installed from git
  version?: string
  author?: string
  hasCommands?: boolean
  commands?: string[]
  tags?: string[]
  updateAvailable?: boolean
  latestVersion?: string
  gitStatus?: {
    ahead: number
    behind: number
    modified: boolean
  }
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
