export const PROJECT_COLOR_PRESETS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#64748b',
  '#78716c',
] as const

const HEX_RE = /^#[0-9A-Fa-f]{6}$/

export function parseProjectColor(value: string | undefined | null): string {
  if (!value?.trim()) return ''
  const v = value.trim()
  if (HEX_RE.test(v)) return v.toLowerCase()
  if (/^[0-9A-Fa-f]{6}$/.test(v)) return `#${v.toLowerCase()}`
  return ''
}

export function projectNameStyle(
  color: string | undefined,
): { color: string } | undefined {
  const c = parseProjectColor(color)
  if (!c) return undefined
  return { color: c }
}
