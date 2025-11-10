import fs from 'fs/promises'
import path from 'path'

const BACKUP_DIR = path.join(process.cwd(), 'data', 'backups')

export interface Backup {
  id: string
  filePath: string
  timestamp: Date
  size: number
}

/**
 * Create a backup of a file
 */
export async function createBackup(filePath: string, content: string): Promise<Backup> {
  // Ensure backup directory exists
  await fs.mkdir(BACKUP_DIR, { recursive: true })

  const timestamp = Date.now()
  const fileName = path.basename(filePath)
  const backupId = `${fileName}-${timestamp}`
  const backupPath = path.join(BACKUP_DIR, backupId)

  // Write backup file
  await fs.writeFile(backupPath, content, 'utf-8')

  return {
    id: backupId,
    filePath,
    timestamp: new Date(timestamp),
    size: content.length,
  }
}

/**
 * List all backups, optionally filtered by file path
 */
export async function listBackups(filePath?: string): Promise<Backup[]> {
  try {
    // Ensure backup directory exists
    await fs.mkdir(BACKUP_DIR, { recursive: true })

    const files = await fs.readdir(BACKUP_DIR)
    const backups: Backup[] = []

    for (const file of files) {
      // Filter by file path if provided
      if (filePath && !file.startsWith(path.basename(filePath))) {
        continue
      }

      const fullPath = path.join(BACKUP_DIR, file)
      const stats = await fs.stat(fullPath)

      // Extract timestamp from filename (format: filename-timestamp)
      const parts = file.split('-')
      const timestampStr = parts[parts.length - 1]
      const timestamp = parseInt(timestampStr, 10)

      if (isNaN(timestamp)) {
        continue
      }

      backups.push({
        id: file,
        filePath: filePath || parts.slice(0, -1).join('-'),
        timestamp: new Date(timestamp),
        size: stats.size,
      })
    }

    // Sort by timestamp descending (newest first)
    return backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  } catch (error) {
    console.error('Failed to list backups:', error)
    return []
  }
}

/**
 * Restore a backup by its ID
 */
export async function restoreBackup(backupId: string): Promise<string> {
  const backupPath = path.join(BACKUP_DIR, backupId)

  try {
    return await fs.readFile(backupPath, 'utf-8')
  } catch {
    throw new Error(`Failed to restore backup: ${backupId}`)
  }
}

/**
 * Clean up old backups older than retention period
 */
export async function cleanOldBackups(retentionDays: number = 7): Promise<number> {
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000

  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true })
    const files = await fs.readdir(BACKUP_DIR)
    let deleted = 0

    for (const file of files) {
      // Extract timestamp from filename
      const parts = file.split('-')
      const timestampStr = parts[parts.length - 1]
      const timestamp = parseInt(timestampStr, 10)

      if (!isNaN(timestamp) && timestamp < cutoff) {
        await fs.unlink(path.join(BACKUP_DIR, file))
        deleted++
      }
    }

    return deleted
  } catch (error) {
    console.error('Failed to clean old backups:', error)
    return 0
  }
}

/**
 * Delete a specific backup
 */
export async function deleteBackup(backupId: string): Promise<void> {
  const backupPath = path.join(BACKUP_DIR, backupId)

  try {
    await fs.unlink(backupPath)
  } catch {
    throw new Error(`Failed to delete backup: ${backupId}`)
  }
}

/**
 * Get backup details
 */
export async function getBackup(backupId: string): Promise<Backup | null> {
  const backupPath = path.join(BACKUP_DIR, backupId)

  try {
    const stats = await fs.stat(backupPath)

    // Extract timestamp from filename
    const parts = backupId.split('-')
    const timestampStr = parts[parts.length - 1]
    const timestamp = parseInt(timestampStr, 10)

    if (isNaN(timestamp)) {
      return null
    }

    return {
      id: backupId,
      filePath: parts.slice(0, -1).join('-'),
      timestamp: new Date(timestamp),
      size: stats.size,
    }
  } catch {
    return null
  }
}

