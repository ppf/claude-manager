import type { Database as Sqlite3Database } from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import type { SearchResult } from '@/types/claude-config'

const SCHEMA_VERSION = 1
const DEFAULT_DB_PATH = './data/search.db'

// Hold runtime instance lazily to avoid requiring native bindings during build
let _BetterSqlite3: ((filename: string) => Sqlite3Database) | null = null
let db: Sqlite3Database | null = null

interface SearchDocument {
  id: string
  type: 'config' | 'skill' | 'plugin' | 'mcp'
  title: string
  path: string
  body: string
}

/**
 * Get or create database connection
 */
function getDatabase(): Sqlite3Database {
  if (db) return db

  const dbPath = process.env.DATABASE_PATH || DEFAULT_DB_PATH
  const dbDir = path.dirname(dbPath)

  // Ensure directory exists
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }

  // Lazily require better-sqlite3 at runtime to prevent build-time native binding load
  if (!_BetterSqlite3) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, import/no-commonjs
    const mod = require('better-sqlite3') as unknown as (filename: string) => Sqlite3Database
    _BetterSqlite3 = mod
  }

  db = _BetterSqlite3!(dbPath)
  
  // Enable WAL mode for better concurrency
  db.pragma('journal_mode = WAL')
  
  initializeSchema()
  
  return db
}

/**
 * Initialize database schema
 */
function initializeSchema() {
  if (!db) return

  // Create meta table for schema version
  db.exec(`
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `)

  // Check schema version
  const version = db.prepare('SELECT value FROM meta WHERE key = ?').get('schema_version') as { value: string } | undefined
  const currentVersion = version ? parseInt(version.value) : 0

  if (currentVersion < SCHEMA_VERSION) {
    // Drop existing FTS table if exists
    db.exec('DROP TABLE IF EXISTS search_index;')

    // Create FTS5 virtual table with porter stemming
    db.exec(`
      CREATE VIRTUAL TABLE search_index USING fts5(
        id UNINDEXED,
        type UNINDEXED,
        title,
        path UNINDEXED,
        body,
        tokenize='porter unicode61'
      );
    `)

    // Update schema version
    db.prepare('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)').run('schema_version', SCHEMA_VERSION.toString())
  }
}

/**
 * Upsert a document into the search index
 */
export function upsertDocument(doc: SearchDocument): void {
  const db = getDatabase()
  
  // Remove existing document
  db.prepare('DELETE FROM search_index WHERE id = ?').run(doc.id)
  
  // Insert new document
  db.prepare(`
    INSERT INTO search_index (id, type, title, path, body)
    VALUES (?, ?, ?, ?, ?)
  `).run(doc.id, doc.type, doc.title, doc.path, doc.body)
}

/**
 * Remove a document from the search index
 */
export function removeDocument(id: string): void {
  const db = getDatabase()
  db.prepare('DELETE FROM search_index WHERE id = ?').run(id)
}

/**
 * Query the search index
 */
export function query(
  searchQuery: string,
  type?: 'config' | 'skill' | 'plugin' | 'mcp',
  limit: number = 20
): SearchResult[] {
  const db = getDatabase()

  // Sanitize query for FTS5
  const sanitizedQuery = searchQuery.trim().replace(/[^\w\s-]/g, '').split(/\s+/).join(' OR ')
  
  if (!sanitizedQuery) return []

  // Build SQL query
  let sql = `
    SELECT 
      id,
      type,
      title,
      path,
      snippet(search_index, 4, '<mark>', '</mark>', '...', 32) as excerpt,
      bm25(search_index) as score
    FROM search_index
    WHERE search_index MATCH ?
  `

  const params: (string | number)[] = [sanitizedQuery]

  if (type) {
    sql += ` AND type = ?`
    params.push(type)
  }

  sql += ` ORDER BY bm25(search_index) LIMIT ?`
  params.push(limit)

  const results = db.prepare(sql).all(...params) as Array<{
    id: string
    type: 'config' | 'skill' | 'plugin' | 'mcp'
    title: string
    path: string
    excerpt: string
    score: number
  }>

  return results.map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    path: row.path,
    excerpt: row.excerpt,
    score: Math.abs(row.score), // BM25 returns negative scores, convert to positive
  }))
}

/**
 * Clear all documents from the index
 */
export function clearIndex(): void {
  const db = getDatabase()
  db.prepare('DELETE FROM search_index').run()
}

/**
 * Get total document count
 */
export function getDocumentCount(): number {
  const db = getDatabase()
  const result = db.prepare('SELECT COUNT(*) as count FROM search_index').get() as { count: number }
  return result.count
}

/**
 * Close database connection
 */
export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}

