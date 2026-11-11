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

export const api = {
  login: (username: string, password: string) =>
    request<{ token: string; username: string }>('/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  devices: () =>
    request<
      Array<{ id: number; deviceUid: string; label: string; lastSeenAt: string | null; createdAt: string }>
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
  sms: (params?: { deviceId?: string; q?: string }) => {
    const q = new URLSearchParams()
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
  calls: (params?: { deviceId?: string; q?: string }) => {
    const q = new URLSearchParams()
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
