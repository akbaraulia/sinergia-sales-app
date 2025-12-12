/**
 * SQLite Database Helper
 * Local temporary storage for report recipients
 */
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DB_DIR = path.join(process.cwd(), 'data')
const DB_PATH = path.join(DB_DIR, 'recipients.db')

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true })
}

// Initialize database connection
let db: Database.Database | null = null

function getDb() {
  if (!db) {
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    
    // Create recipients table if not exists
    db.exec(`
      CREATE TABLE IF NOT EXISTS recipients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id TEXT NOT NULL UNIQUE,
        employee_name TEXT NOT NULL,
        designation TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    console.log('📦 [SQLite] Database initialized:', DB_PATH)
  }
  return db
}

export interface Recipient {
  id: number
  employee_id: string
  employee_name: string
  designation: string | null
  created_at: string
}

/**
 * Get all recipients
 */
export function getAllRecipients(): Recipient[] {
  const db = getDb()
  const stmt = db.prepare('SELECT * FROM recipients ORDER BY employee_name')
  return stmt.all() as Recipient[]
}

/**
 * Add a new recipient
 */
export function addRecipient(
  employee_id: string, 
  employee_name: string,
  designation?: string
): Recipient {
  const db = getDb()
  const stmt = db.prepare(
    'INSERT INTO recipients (employee_id, employee_name, designation) VALUES (?, ?, ?)'
  )
  const info = stmt.run(employee_id, employee_name, designation || null)
  
  // Return the inserted record
  const getStmt = db.prepare('SELECT * FROM recipients WHERE id = ?')
  return getStmt.get(info.lastInsertRowid) as Recipient
}

/**
 * Remove a recipient by employee_id
 */
export function removeRecipient(employee_id: string): boolean {
  const db = getDb()
  const stmt = db.prepare('DELETE FROM recipients WHERE employee_id = ?')
  const info = stmt.run(employee_id)
  return info.changes > 0
}

/**
 * Check if recipient exists
 */
export function recipientExists(employee_id: string): boolean {
  const db = getDb()
  const stmt = db.prepare('SELECT COUNT(*) as count FROM recipients WHERE employee_id = ?')
  const result = stmt.get(employee_id) as { count: number }
  return result.count > 0
}

/**
 * Get recipient by employee_id
 */
export function getRecipient(employee_id: string): Recipient | null {
  const db = getDb()
  const stmt = db.prepare('SELECT * FROM recipients WHERE employee_id = ?')
  return stmt.get(employee_id) as Recipient | null
}

/**
 * Close database connection (for cleanup)
 */
export function closeDb() {
  if (db) {
    db.close()
    db = null
  }
}
