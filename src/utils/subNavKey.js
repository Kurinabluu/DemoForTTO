function slugifySubNavPath(value) {
  const raw = (value || '').trim()
  if (!raw) return 'item'

  const ascii = raw
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/[''`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  if (ascii) {
    return ascii.substring(0, Math.min(96, ascii.length))
  }

  const fallback = raw.replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fff-]+/g, '')
  return fallback || 'item'
}

export function buildSubNavKey(sectionPath, subNavName) {
  const path = String(sectionPath || '').replace(/^\/+/, '')
  return `${path}:${slugifySubNavPath(subNavName)}`
}
