export function buildInquirySourceSection(pageId, moduleId, entryId) {
  const page = String(pageId || '').trim()
  const module = String(moduleId || '').trim()
  const entry = String(entryId || '').trim()
  const parts = [page, module, entry].filter(Boolean)
  if (parts.length) return parts.join('::')
  return 'unknown::unknown'
}
