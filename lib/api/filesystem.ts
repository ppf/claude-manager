import fs from 'fs/promises'
import path from 'path'
import { sanitizePath } from '@/lib/claude/paths'
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
      } catch {
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
