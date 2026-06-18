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

export function extractDayTripTabKey(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''

  const tabMatch = raw.match(/^(\d{1,2})(?:日行程)?$/)
  if (tabMatch) return tabMatch[1]

  const dayPrefix = raw.match(/^(\d{1,2})/)
  return dayPrefix ? dayPrefix[1] : ''
}

/** 一日游/多日游 URL query：使用数字键，如 1、16 */
export function buildDayTripTabQuery(subNavName) {
  const key = extractDayTripTabKey(subNavName)
  return key || String(subNavName || '').trim()
}

/** 将 dayTripTab query（1 或 1日行程）解析为 nav 中的 subNavName */
export function resolveDayTripSubNavName(tabValue, subNavList = []) {
  const raw = String(tabValue || '').trim()
  if (!raw) return ''

  const direct = subNavList.find((sub) => sub?.subNavName === raw)
  if (direct?.subNavName) return direct.subNavName

  const tabKey = extractDayTripTabKey(raw)
  if (tabKey) {
    const matched = subNavList.find(
      (sub) => extractDayTripTabKey(sub?.subNavName) === tabKey
    )
    if (matched?.subNavName) return matched.subNavName
  }

  return raw
}

export function buildSubNavKey(sectionPath, subNavName) {
  const path = String(sectionPath || '').replace(/^\/+/, '')
  const name = String(subNavName || '').trim()
  if (path === 'trips/routes') {
    const dayKey = extractDayTripTabKey(name)
    if (dayKey) {
      return `${path}:${dayKey}`
    }
  }
  return `${path}:${slugifySubNavPath(name)}`
}
