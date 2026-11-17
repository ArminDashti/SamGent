import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'

export const DEFAULT_INTERVALS = {
  sms: 900,
  calls: 900,
  gps: 300,
  networkSignal: 300,
  networkType: 300,
  battery: 600,
  wifiSignal: 300,
  wifiSsid: 60,
  publicIp: 900,
}

export const INTERVAL_KEYS = Object.keys(DEFAULT_INTERVALS)

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

    CREATE TABLE IF NOT EXISTS device_intervals (
      device_id INTEGER PRIMARY KEY REFERENCES devices(id) ON DELETE CASCADE,
      sms INTEGER NOT NULL DEFAULT 900,
      calls INTEGER NOT NULL DEFAULT 900,
      gps INTEGER NOT NULL DEFAULT 300,
      network_signal INTEGER NOT NULL DEFAULT 300,
      network_type INTEGER NOT NULL DEFAULT 300,
      battery INTEGER NOT NULL DEFAULT 600,
      wifi_signal INTEGER NOT NULL DEFAULT 300,
      wifi_ssid INTEGER NOT NULL DEFAULT 60,
      public_ip INTEGER NOT NULL DEFAULT 900,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_by TEXT NOT NULL DEFAULT 'web'
    );

    CREATE TABLE IF NOT EXISTS device_telemetry (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
      kind TEXT NOT NULL,
      recorded_at TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_sms_received ON sms_messages(received_at DESC);
    CREATE INDEX IF NOT EXISTS idx_sms_address ON sms_messages(address);
    CREATE INDEX IF NOT EXISTS idx_calls_called ON call_logs(called_at DESC);
    CREATE INDEX IF NOT EXISTS idx_entities_type ON parsed_entities(type);
    CREATE INDEX IF NOT EXISTS idx_entities_value ON parsed_entities(value);
    CREATE INDEX IF NOT EXISTS idx_telemetry_lookup ON device_telemetry(device_id, kind, recorded_at DESC);
  `)

  const deviceCols = db.prepare(`PRAGMA table_info(devices)`).all().map((c) => c.name)
  if (!deviceCols.includes('os_version')) {
    db.exec(`ALTER TABLE devices ADD COLUMN os_version TEXT`)
  }

  const devices = db.prepare('SELECT id FROM devices').all()
  for (const d of devices) {
    ensureDeviceIntervals(db, d.id)
  }
}

export function ensureDeviceIntervals(db, deviceId) {
  const existing = db.prepare('SELECT device_id FROM device_intervals WHERE device_id = ?').get(deviceId)
  if (existing) return
  db.prepare(
    `INSERT INTO device_intervals (
      device_id, sms, calls, gps, network_signal, network_type, battery,
      wifi_signal, wifi_ssid, public_ip, updated_at, updated_by
    ) VALUES (?, 900, 900, 300, 300, 300, 600, 300, 60, 900, datetime('now'), 'web')`,
  ).run(deviceId)
}

export function rowToIntervals(row) {
  if (!row) return null
  return {
    sms: row.sms,
    calls: row.calls,
    gps: row.gps,
    networkSignal: row.network_signal,
    networkType: row.network_type,
    battery: row.battery,
    wifiSignal: row.wifi_signal,
    wifiSsid: row.wifi_ssid,
    publicIp: row.public_ip,
    updatedAt: toIso(row.updated_at),
    updatedBy: row.updated_by,
  }
}

function toIso(sqliteTs) {
  if (!sqliteTs) return new Date().toISOString()
  if (String(sqliteTs).includes('T')) return String(sqliteTs)
  return `${String(sqliteTs).replace(' ', 'T')}Z`
}

export function parseIntervalBody(body) {
  const out = {}
  for (const key of INTERVAL_KEYS) {
    const v = body?.[key]
    const n = Number(v)
    if (!Number.isFinite(n) || n < 60 || n > 86400) {
      return { error: `invalid_interval_${key}` }
    }
    out[key] = Math.floor(n)
  }
  return { intervals: out }
}

export function getIntervals(db, deviceId) {
  ensureDeviceIntervals(db, deviceId)
  const row = db.prepare('SELECT * FROM device_intervals WHERE device_id = ?').get(deviceId)
  return rowToIntervals(row)
}

export function putIntervals(db, deviceId, intervals, updatedBy) {
  ensureDeviceIntervals(db, deviceId)
  db.prepare(
    `UPDATE device_intervals SET
      sms = ?, calls = ?, gps = ?, network_signal = ?, network_type = ?,
      battery = ?, wifi_signal = ?, wifi_ssid = ?, public_ip = ?,
      updated_at = datetime('now'), updated_by = ?
     WHERE device_id = ?`,
  ).run(
    intervals.sms,
    intervals.calls,
    intervals.gps,
    intervals.networkSignal,
    intervals.networkType,
    intervals.battery,
    intervals.wifiSignal,
    intervals.wifiSsid,
    intervals.publicIp,
    updatedBy,
    deviceId,
  )
  return getIntervals(db, deviceId)
}

export function seedAdmin(db, username, password) {
  const row = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
  if (row) return
  const password_hash = bcrypt.hashSync(password, 10)
  db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username, password_hash)
}
