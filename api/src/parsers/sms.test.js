import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseSms } from './sms.js'

test('extracts otp and sender', () => {
  const ents = parseSms({ address: 'Bank', body: 'Your OTP code is 123456. Do not share.' })
  assert.ok(ents.some((e) => e.type === 'sender' && e.value === 'Bank'))
  assert.ok(ents.some((e) => e.type === 'otp' && e.value === '123456'))
})

test('extracts url', () => {
  const ents = parseSms({ address: 'X', body: 'Open https://example.com/a now' })
  assert.ok(ents.some((e) => e.type === 'url' && e.value.includes('example.com')))
})
