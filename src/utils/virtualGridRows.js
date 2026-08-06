export function buildSectionVirtualRows(sections, columns = 4) {
  const cols = Math.max(1, Number(columns) || 1)
  const rows = []
  for (const section of Array.isArray(sections) ? sections : []) {
    if (!section) continue
    rows.push({
      type: 'header',
      key: `header-${section.label}`,
      title: section.title || section.label || '',
    })
    const items = Array.isArray(section.items) ? section.items : []
    for (let i = 0; i < items.length; i += cols) {
      rows.push({
        type: 'cards',
        key: `cards-${section.label}-${i}`,
        items: items.slice(i, i + cols),
        baseIndex: (section.startIndex || 0) + i,
      })
    }
  }
  return rows
}

export function buildFlatVirtualRows(items, columns, shouldShowTitle, getTitle) {
  const cols = Math.max(1, Number(columns) || 1)
  const list = Array.isArray(items) ? items : []
  const rows = []

  for (let i = 0; i < list.length; i += cols) {
    const chunk = list.slice(i, i + cols)
    if (typeof shouldShowTitle === 'function' && shouldShowTitle(list, i)) {
      const title = typeof getTitle === 'function' ? getTitle(list[i]) : ''
      rows.push({
        type: 'header',
        key: `header-${i}`,
        title: title || '',
      })
    }
    rows.push({
      type: 'cards',
      key: `cards-${i}`,
      items: chunk,
      baseIndex: i,
    })
  }

  return rows
}

export function estimateVirtualRowSize(row) {
  if (!row || row.type === 'header') return 56
  return 300
}
