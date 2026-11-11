import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'

export function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash)
}

export function hashSecret(secret) {
  return bcrypt.hashSync(secret, 10)
}

export function newApiKey() {
  return crypto.randomBytes(24).toString('base64url')
}

export function newDeviceUid() {
  return crypto.randomUUID()
}
