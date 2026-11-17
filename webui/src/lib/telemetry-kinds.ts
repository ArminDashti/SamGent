export const TELEMETRY_KINDS = [
  { slug: 'gps', apiKind: 'gps', label: 'GPS' },
  { slug: 'network-signal', apiKind: 'network_signal', label: 'Network signal' },
  { slug: 'network-type', apiKind: 'network_type', label: 'Network type' },
  { slug: 'battery', apiKind: 'battery', label: 'Battery' },
  { slug: 'wifi', apiKind: 'wifi', label: 'Wi‑Fi' },
  { slug: 'public-ip', apiKind: 'public_ip', label: 'Public IP' },
] as const

export type TelemetrySlug = (typeof TELEMETRY_KINDS)[number]['slug']

export function apiKindFromSlug(slug: string | undefined): string | null {
  const row = TELEMETRY_KINDS.find((k) => k.slug === slug)
  return row?.apiKind ?? null
}

export function slugFromApiKind(kind: string): string {
  const row = TELEMETRY_KINDS.find((k) => k.apiKind === kind)
  return row?.slug ?? kind
}