import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import { openDb, seedAdmin } from './db.js'
import { verifyPassword, hashSecret, newApiKey, newDeviceUid } from './auth.js'
import { parseSms } from './parsers/sms.js'

const PORT = Number(process.env.PORT || 3980)
const SQLITE_PATH = process.env.SQLITE_PATH || './data/samgent.db'
const JWT_SECRET = process.env.JWT_SECRET || 'samgent-dev-jwt-change-me'
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'armin'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'dopadopa123'
const CORS_ORIGIN = process.env.CORS_ORIGIN || true

const db = openDb(SQLITE_PATH)
seedAdmin(db, ADMIN_USERNAME, ADMIN_PASSWORD)

const app = Fastify({ logger: true })
await app.register(cors, { origin: CORS_ORIGIN === 'true' ? true : CORS_ORIGIN })
await app.register(jwt, { secret: JWT_SECRET })

app.decorate('authenticate', async (request, reply) => {
  try {
    await request.jwtVerify()
  } catch {
    return reply.code(401).send({ error: 'unauthorized' })
  }
})

function requireDevice(request, reply) {
  const key = request.headers['x-device-key']
  if (!key || typeof key !== 'string') {
    reply.code(401).send({ error: 'missing_device_key' })
    return null
  }
  const devices = db.prepare('SELECT * FROM devices').all()
  for (const d of devices) {
    if (verifyPassword(key, d.api_key_hash)) return d
  }
  reply.code(401).send({ error: 'invalid_device_key' })
  return null
}

app.get('/health', async () => ({ ok: true }))

app.post('/v1/auth/login', async (request, reply) => {
  const { username, password } = request.body || {}
  if (!username || !password) return reply.code(400).send({ error: 'username_password_required' })
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username)
  if (!user || !verifyPassword(password, user.password_hash)) {
    return reply.code(401).send({ error: 'invalid_credentials' })
  }
  const token = app.jwt.sign({ sub: user.id, username: user.username }, { expiresIn: '7d' })
  return { token, username: user.username }
})

app.get('/v1/devices', { preHandler: [app.authenticate] }, async () => {
  return db
    .prepare(
      `SELECT id, device_uid AS deviceUid, label, last_seen_at AS lastSeenAt, created_at AS createdAt FROM devices ORDER BY id DESC`,
    )
    .all()
})

app.post('/v1/devices', { preHandler: [app.authenticate] }, async (request, reply) => {
  const { label } = request.body || {}
  if (!label || typeof label !== 'string' || !label.trim()) {
    return reply.code(400).send({ error: 'label_required' })
  }
  const deviceUid = newDeviceUid()
  const apiKey = newApiKey()
  const apiKeyHash = hashSecret(apiKey)
  try {
    const info = db
      .prepare(
        `INSERT INTO devices (device_uid, label, api_key_hash, last_seen_at) VALUES (?, ?, ?, datetime('now'))`,
      )
      .run(deviceUid, label.trim(), apiKeyHash)
    return {
      id: Number(info.lastInsertRowid),
      deviceUid,
      label: label.trim(),
      apiKey,
    }
  } catch (err) {
    request.log.error(err)
    return reply.code(500).send({ error: 'create_device_failed' })
  }
})

app.post('/v1/devices/:id/rotate', { preHandler: [app.authenticate] }, async (request, reply) => {
  const id = Number(request.params.id)
  if (!Number.isInteger(id) || id < 1) return reply.code(400).send({ error: 'invalid_device_id' })
  const row = db.prepare('SELECT id, device_uid AS deviceUid, label FROM devices WHERE id = ?').get(id)
  if (!row) return reply.code(404).send({ error: 'device_not_found' })
  const apiKey = newApiKey()
  const apiKeyHash = hashSecret(apiKey)
  db.prepare(`UPDATE devices SET api_key_hash = ? WHERE id = ?`).run(apiKeyHash, id)
  return { id: row.id, deviceUid: row.deviceUid, label: row.label, apiKey }
})

app.post('/v1/ingest', async (request, reply) => {
  const device = requireDevice(request, reply)
  if (!device) return

  const { sms = [], calls = [] } = request.body || {}
  if (!Array.isArray(sms) || !Array.isArray(calls)) {
    return reply.code(400).send({ error: 'sms_and_calls_must_be_arrays' })
  }

  const insertSms = db.prepare(`
    INSERT OR IGNORE INTO sms_messages
      (device_id, provider_msg_id, address, body, direction, received_at, raw_json)
    VALUES (@device_id, @provider_msg_id, @address, @body, @direction, @received_at, @raw_json)
  `)
  const insertEntity = db.prepare(`
    INSERT INTO parsed_entities (sms_id, type, value, confidence, meta_json)
    VALUES (?, ?, ?, ?, ?)
  `)
  const insertCall = db.prepare(`
    INSERT OR IGNORE INTO call_logs
      (device_id, fingerprint, number, name, type, duration_sec, called_at)
    VALUES (@device_id, @fingerprint, @number, @name, @type, @duration_sec, @called_at)
  `)
  const touch = db.prepare(`UPDATE devices SET last_seen_at = datetime('now') WHERE id = ?`)

  let smsInserted = 0
  let callsInserted = 0
  let entitiesInserted = 0

  const tx = db.transaction(() => {
    touch.run(device.id)
    for (const item of sms) {
      const provider_msg_id = String(item.providerMsgId || item.id || '')
      const address = String(item.address || '')
      const body = String(item.body || '')
      const received_at = String(item.receivedAt || new Date().toISOString())
      const direction = String(item.direction || 'inbox')
      if (!provider_msg_id || !address) continue
      const result = insertSms.run({
        device_id: device.id,
        provider_msg_id,
        address,
        body,
        direction,
        received_at,
        raw_json: JSON.stringify(item),
      })
      if (result.changes === 0) continue
      smsInserted += 1
      const smsId = Number(result.lastInsertRowid)
      for (const ent of parseSms({ address, body })) {
        insertEntity.run(
          smsId,
          ent.type,
          ent.value,
          ent.confidence ?? 1,
          ent.meta ? JSON.stringify(ent.meta) : null,
        )
        entitiesInserted += 1
      }
    }
    for (const item of calls) {
      const number = String(item.number || '')
      const called_at = String(item.calledAt || '')
      const type = String(item.type || 'unknown')
      const duration_sec = Number(item.durationSec ?? 0)
      if (!number || !called_at) continue
      const fingerprint =
        item.fingerprint ||
        `${number}|${called_at}|${type}|${duration_sec}`
      const result = insertCall.run({
        device_id: device.id,
        fingerprint: String(fingerprint),
        number,
        name: item.name != null ? String(item.name) : null,
        type,
        duration_sec,
        called_at,
      })
      if (result.changes > 0) callsInserted += 1
    }
  })

  tx()
  return { ok: true, smsInserted, callsInserted, entitiesInserted }
})

app.get('/v1/sms', { preHandler: [app.authenticate] }, async (request) => {
  const { deviceId, q, limit = '100' } = request.query || {}
  const lim = Math.min(Number(limit) || 100, 500)
  let sql = `
    SELECT s.id, s.device_id AS deviceId, d.label AS deviceLabel, s.address, s.body,
           s.direction, s.received_at AS receivedAt
    FROM sms_messages s
    JOIN devices d ON d.id = s.device_id
    WHERE 1=1`
  const params = []
  if (deviceId) {
    sql += ' AND s.device_id = ?'
    params.push(Number(deviceId))
  }
  if (q) {
    sql += ' AND (s.body LIKE ? OR s.address LIKE ?)'
    params.push(`%${q}%`, `%${q}%`)
  }
  sql += ' ORDER BY s.received_at DESC LIMIT ?'
  params.push(lim)
  return db.prepare(sql).all(...params)
})

app.get('/v1/calls', { preHandler: [app.authenticate] }, async (request) => {
  const { deviceId, q, limit = '100' } = request.query || {}
  const lim = Math.min(Number(limit) || 100, 500)
  let sql = `
    SELECT c.id, c.device_id AS deviceId, d.label AS deviceLabel, c.number, c.name,
           c.type, c.duration_sec AS durationSec, c.called_at AS calledAt
    FROM call_logs c
    JOIN devices d ON d.id = c.device_id
    WHERE 1=1`
  const params = []
  if (deviceId) {
    sql += ' AND c.device_id = ?'
    params.push(Number(deviceId))
  }
  if (q) {
    sql += ' AND (c.number LIKE ? OR IFNULL(c.name, "") LIKE ?)'
    params.push(`%${q}%`, `%${q}%`)
  }
  sql += ' ORDER BY c.called_at DESC LIMIT ?'
  params.push(lim)
  return db.prepare(sql).all(...params)
})

app.get('/v1/entities', { preHandler: [app.authenticate] }, async (request) => {
  const { type, q, limit = '100' } = request.query || {}
  const lim = Math.min(Number(limit) || 100, 500)
  let sql = `
    SELECT e.id, e.sms_id AS smsId, e.type, e.value, e.confidence,
           s.address, s.body, s.received_at AS receivedAt, d.label AS deviceLabel
    FROM parsed_entities e
    JOIN sms_messages s ON s.id = e.sms_id
    JOIN devices d ON d.id = s.device_id
    WHERE 1=1`
  const params = []
  if (type) {
    sql += ' AND e.type = ?'
    params.push(String(type))
  }
  if (q) {
    sql += ' AND e.value LIKE ?'
    params.push(`%${q}%`)
  }
  sql += ' ORDER BY e.id DESC LIMIT ?'
  params.push(lim)
  return db.prepare(sql).all(...params)
})

app.get('/v1/search', { preHandler: [app.authenticate] }, async (request) => {
  const q = String(request.query?.q || '').trim()
  if (!q) return { sms: [], calls: [], entities: [] }
  const like = `%${q}%`
  const sms = db
    .prepare(
      `SELECT id, address, body, received_at AS receivedAt FROM sms_messages
       WHERE body LIKE ? OR address LIKE ? ORDER BY received_at DESC LIMIT 50`,
    )
    .all(like, like)
  const calls = db
    .prepare(
      `SELECT id, number, name, type, called_at AS calledAt FROM call_logs
       WHERE number LIKE ? OR IFNULL(name, "") LIKE ? ORDER BY called_at DESC LIMIT 50`,
    )
    .all(like, like)
  const entities = db
    .prepare(
      `SELECT id, type, value, sms_id AS smsId FROM parsed_entities
       WHERE value LIKE ? ORDER BY id DESC LIMIT 50`,
    )
    .all(like)
  return { sms, calls, entities }
})

app.listen({ port: PORT, host: '0.0.0.0' }).catch((err) => {
  app.log.error(err)
  process.exit(1)
})
