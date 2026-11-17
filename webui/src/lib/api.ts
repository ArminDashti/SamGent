const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3980'

export function getToken(): string | null {
  return localStorage.getItem('samgent_token')
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem('samgent_token', token)
  else localStorage.removeItem('samgent_token')
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const res = await fetch(`${API_URL}${path}`, { ...init, headers })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export type DeviceIntervals = {
  sms: number
  calls: number
  gps: number
  networkSignal: number
  networkType: number
  battery: number
  wifiSignal: number
  wifiSsid: number
  publicIp: number
  updatedAt: string
  updatedBy: string
}

export const INTERVAL_FIELDS: Array<{ key: keyof Omit<DeviceIntervals, 'updatedAt' | 'updatedBy'>; label: string }> = [
  { key: 'sms', label: 'SMS' },
  { key: 'calls', label: 'Calls' },
  { key: 'gps', label: 'GPS' },
  { key: 'networkSignal', label: 'Network signal' },
  { key: 'networkType', label: 'Network type' },
  { key: 'battery', label: 'Battery' },
  { key: 'wifiSignal', label: 'Wi‑Fi signal' },
  { key: 'wifiSsid', label: 'Wi‑Fi SSID debounce' },
  { key: 'publicIp', label: 'Public IP' },
]

export const api = {
  login: (username: string, password: string) =>
    request<{ token: string; username: string }>('/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  devices: () =>
    request<
      Array<{
        id: number
        deviceUid: string
        label: string
        osVersion: string | null
        lastSeenAt: string | null
        createdAt: string
      }>
    >('/v1/devices'),
  createDevice: (label: string) =>
    request<{ id: number; deviceUid: string; label: string; apiKey: string }>('/v1/devices', {
      method: 'POST',
      body: JSON.stringify({ label }),
    }),
  rotateDevice: (id: number) =>
    request<{ id: number; deviceUid: string; label: string; apiKey: string }>(
      `/v1/devices/${id}/rotate`,
      { method: 'POST', body: '{}' },
    ),
  getIntervals: (id: number) => request<DeviceIntervals>(`/v1/devices/${id}/intervals`),
  putIntervals: (id: number, body: Partial<DeviceIntervals> & Record<string, number | string>) =>
    request<DeviceIntervals>(`/v1/devices/${id}/intervals`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  summary: (params?: { deviceId?: string; from?: string; to?: string }) => {
    const q = new URLSearchParams()
    if (params?.deviceId) q.set('deviceId', params.deviceId)
    if (params?.from) q.set('from', params.from)
    if (params?.to) q.set('to', params.to)
    const s = q.toString()
    return request<{
      sms: number
      calls: number
      telemetry: Record<string, number>
    }>(`/v1/summary${s ? `?${s}` : ''}`)
  },
  telemetry: (params?: {
    deviceId?: string
    kind?: string
    from?: string
    to?: string
    limit?: number
  }) => {
    const q = new URLSearchParams()
    q.set('limit', String(params?.limit ?? 500))
    if (params?.deviceId) q.set('deviceId', params.deviceId)
    if (params?.kind) q.set('kind', params.kind)
    if (params?.from) q.set('from', params.from)
    if (params?.to) q.set('to', params.to)
    const s = q.toString()
    return request<
      Array<{
        id: number
        deviceId: number
        deviceLabel: string
        kind: string
        recordedAt: string
        payload: Record<string, unknown>
      }>
    >(`/v1/telemetry${s ? `?${s}` : ''}`)
  },
  sms: (params?: { deviceId?: string; q?: string; limit?: number }) => {
    const q = new URLSearchParams()
    q.set('limit', String(params?.limit ?? 500))
    if (params?.deviceId) q.set('deviceId', params.deviceId)
    if (params?.q) q.set('q', params.q)
    const s = q.toString()
    return request<
      Array<{
        id: number
        deviceId: number
        deviceLabel: string
        address: string
        body: string
        direction: string
        receivedAt: string
      }>
    >(`/v1/sms${s ? `?${s}` : ''}`)
  },
  smsContacts: (params?: { deviceId?: string; from?: string; to?: string; q?: string; limit?: number }) => {
    const q = new URLSearchParams()
    q.set('limit', String(params?.limit ?? 200))
    if (params?.deviceId) q.set('deviceId', params.deviceId)
    if (params?.from) q.set('from', params.from)
    if (params?.to) q.set('to', params.to)
    if (params?.q) q.set('q', params.q)
    const s = q.toString()
    return request<
      Array<{
        contact: string
        phone: string
        sent: number
        receive: number
        updatedAt: string
      }>
    >(`/v1/sms/contacts${s ? `?${s}` : ''}`)
  },
  calls: (params?: { deviceId?: string; q?: string; limit?: number }) => {
    const q = new URLSearchParams()
    q.set('limit', String(params?.limit ?? 500))
    if (params?.deviceId) q.set('deviceId', params.deviceId)
    if (params?.q) q.set('q', params.q)
    const s = q.toString()
    return request<
      Array<{
        id: number
        deviceId: number
        deviceLabel: string
        number: string
        name: string | null
        type: string
        durationSec: number
        calledAt: string
      }>
    >(`/v1/calls${s ? `?${s}` : ''}`)
  },
  callContacts: (params?: { deviceId?: string; from?: string; to?: string; q?: string; limit?: number }) => {
    const q = new URLSearchParams()
    q.set('limit', String(params?.limit ?? 200))
    if (params?.deviceId) q.set('deviceId', params.deviceId)
    if (params?.from) q.set('from', params.from)
    if (params?.to) q.set('to', params.to)
    if (params?.q) q.set('q', params.q)
    const s = q.toString()
    return request<
      Array<{
        contact: string
        number: string
        sent: number
        receive: number
        totalDurationSec: number
        updatedAt: string
      }>
    >(`/v1/calls/contacts${s ? `?${s}` : ''}`)
  },
  entities: (params?: { type?: string; q?: string }) => {
    const q = new URLSearchParams()
    if (params?.type) q.set('type', params.type)
    if (params?.q) q.set('q', params.q)
    const s = q.toString()
    return request<
      Array<{
        id: number
        smsId: number
        type: string
        value: string
        confidence: number
        address: string
        body: string
        receivedAt: string
        deviceLabel: string
      }>
    >(`/v1/entities${s ? `?${s}` : ''}`)
  },
  search: (q: string) =>
    request<{
      sms: Array<{ id: number; address: string; body: string; receivedAt: string }>
      calls: Array<{ id: number; number: string; name: string | null; type: string; calledAt: string }>
      entities: Array<{ id: number; type: string; value: string; smsId: number }>
    }>(`/v1/search?q=${encodeURIComponent(q)}`),
}
