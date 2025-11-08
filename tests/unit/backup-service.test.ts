import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  createBackup,
  listBackups,
  restoreBackup,
  cleanOldBackups,
  deleteBackup,
  getBackup,
} from '@/lib/backup/backup-service'
import fs from 'fs/promises'
import path from 'path'

const BACKUP_DIR = path.join(process.cwd(), 'data', 'backups')
const TEST_CONTENT = 'Test file content for backup'

describe('Backup service', () => {
  beforeEach(async () => {
    // Clean up backup directory before each test
    try {
      await fs.rm(BACKUP_DIR, { recursive: true, force: true })
    } catch (error) {
      // Directory might not exist
    }
  })

  afterEach(async () => {
    // Clean up after tests
    try {
      await fs.rm(BACKUP_DIR, { recursive: true, force: true })
    } catch (error) {
      // Ignore errors
    }
  })

  it('should create a backup', async () => {
    const backup = await createBackup('test.md', TEST_CONTENT)

    expect(backup.id).toBeTruthy()
    expect(backup.filePath).toBe('test.md')
    expect(backup.size).toBe(TEST_CONTENT.length)
    expect(backup.timestamp).toBeInstanceOf(Date)
  })

  it('should list backups', async () => {
    await createBackup('test1.md', 'Content 1')
    await createBackup('test2.md', 'Content 2')

    const backups = await listBackups()
    expect(backups.length).toBe(2)
  })

  it('should filter backups by file path', async () => {
    await createBackup('test1.md', 'Content 1')
    await createBackup('test2.md', 'Content 2')

    const backups = await listBackups('test1.md')
    expect(backups.length).toBe(1)
    expect(backups[0].filePath).toBe('test1.md')
  })

  it('should restore a backup', async () => {
    const backup = await createBackup('test.md', TEST_CONTENT)
    const restored = await restoreBackup(backup.id)

    expect(restored).toBe(TEST_CONTENT)
  })

  it('should throw error when restoring non-existent backup', async () => {
    await expect(restoreBackup('nonexistent-backup')).rejects.toThrow()
  })

  it('should clean old backups', async () => {
    // Create old backup by manually creating file with old timestamp
    const oldTimestamp = Date.now() - 10 * 24 * 60 * 60 * 1000 // 10 days ago
    const oldBackupId = `test.md-${oldTimestamp}`
    await fs.mkdir(BACKUP_DIR, { recursive: true })
    await fs.writeFile(path.join(BACKUP_DIR, oldBackupId), TEST_CONTENT)

    // Create recent backup
    await createBackup('test.md', 'Recent content')

    const deleted = await cleanOldBackups(7)
    expect(deleted).toBe(1)

    const backups = await listBackups()
    expect(backups.length).toBe(1)
  })

  it('should delete a specific backup', async () => {
    const backup = await createBackup('test.md', TEST_CONTENT)
    await deleteBackup(backup.id)

    const backups = await listBackups()
    expect(backups.length).toBe(0)
  })

  it('should get backup details', async () => {
    const created = await createBackup('test.md', TEST_CONTENT)
    const retrieved = await getBackup(created.id)

    expect(retrieved).toBeTruthy()
    expect(retrieved?.id).toBe(created.id)
    expect(retrieved?.size).toBe(TEST_CONTENT.length)
  })

  it('should return null for non-existent backup', async () => {
    const backup = await getBackup('nonexistent')
    expect(backup).toBeNull()
  })

  it('should sort backups by timestamp descending', async () => {
    await createBackup('test1.md', 'Content 1')
    await new Promise((resolve) => setTimeout(resolve, 100))
    await createBackup('test2.md', 'Content 2')

    const backups = await listBackups()
    expect(backups[0].timestamp.getTime()).toBeGreaterThan(backups[1].timestamp.getTime())
  })
})

