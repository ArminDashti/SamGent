import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'

export function openDb(sqlitePath) {
  fs.mkdirSync(path.dirname(path.resolve(sqlitePath)), { recursive: true })
  const db = new Database(sqlitePath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  migrate(db)
  return db
}

function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_uid TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      api_key_hash TEXT NOT NULL,
      last_seen_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sms_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
      provider_msg_id TEXT NOT NULL,
      address TEXT NOT NULL,
      body TEXT NOT NULL,
      direction TEXT NOT NULL DEFAULT 'inbox',
      received_at TEXT NOT NULL,
      raw_json TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(device_id, provider_msg_id)
    );

    CREATE TABLE IF NOT EXISTS call_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
      fingerprint TEXT NOT NULL,
      number TEXT NOT NULL,
      name TEXT,
      type TEXT NOT NULL,
      duration_sec INTEGER NOT NULL DEFAULT 0,
      called_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(device_id, fingerprint)
    );

    CREATE TABLE IF NOT EXISTS parsed_entities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sms_id INTEGER NOT NULL REFERENCES sms_messages(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      value TEXT NOT NULL,
      confidence REAL NOT NULL DEFAULT 1,
      meta_json TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_sms_received ON sms_messages(received_at DESC);
    CREATE INDEX IF NOT EXISTS idx_sms_address ON sms_messages(address);
    CREATE INDEX IF NOT EXISTS idx_calls_called ON call_logs(called_at DESC);
    CREATE INDEX IF NOT EXISTS idx_entities_type ON parsed_entities(type);
    CREATE INDEX IF NOT EXISTS idx_entities_value ON parsed_entities(value);
  `)
}

export function seedAdmin(db, username, password) {
  const row = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
  if (row) return
  const password_hash = bcrypt.hashSync(password, 10)
  db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username, password_hash)
}
