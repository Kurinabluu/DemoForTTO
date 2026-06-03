const normalizeForSearch = (str) => (str || '').toLowerCase()

const isAsciiToken = (token) => /^[a-z0-9]+$/i.test(token)

const tokenizeForSearch = (str) =>
  normalizeForSearch(str)
    .split(/[\s,./\\\-+()'"“”‘’!?;:]+/)
    .filter(Boolean)

const buildEffectiveQueryTokens = (keyword) => {
  const rawTokens = tokenizeForSearch(keyword)
  const compactQuery = normalizeForSearch(keyword).replace(/\s+/g, '')

  const filtered = rawTokens.filter((token) => {
    if (isAsciiToken(token)) return token.length >= 2
    return token.length >= 1
  })

  if (!filtered.length && compactQuery.length >= 2) {
    return [compactQuery]
  }
  return filtered
}

const splitSearchWords = (normText) =>
  String(normText || '')
    .split(/[^a-z0-9\u4e00-\u9fff]+/i)
    .filter(Boolean)

const tokenMatchesWord = (kwTok, words, textNorm) => {
  if (!isAsciiToken(kwTok)) return textNorm.includes(kwTok)
  return words.some((word) => {
    if (word === kwTok) return true
    if (word === kwTok + 's') return true
    if (word + 's' === kwTok) return true
    if (word.startsWith(kwTok)) return true
    return false
  })
}

export function evaluateSearchTextMatch(text, keyword) {
  const kwRaw = (keyword || '').trim()
  if (!kwRaw) return true

  const kwNorm = normalizeForSearch(kwRaw)
  const textNorm = normalizeForSearch(text)
  if (!textNorm) return false

  const kwTokens = buildEffectiveQueryTokens(kwNorm)
  if (!kwTokens.length) return false

  const compactText = textNorm.replace(/\s+/g, '')
  const compactQuery = kwNorm.replace(/\s+/g, '')
  if (compactQuery.length >= 2 && compactText.includes(compactQuery)) return true
  if (textNorm.includes(kwNorm)) return true

  const words = splitSearchWords(textNorm)
  return kwTokens.every((kwTok) => tokenMatchesWord(kwTok, words, textNorm))
}

export function textMatchesKeyword(text, keyword) {
  return evaluateSearchTextMatch(text, keyword)
}

/** 网格项字段拼接后与全站 searchText 规则一致 */
export function tourItemMatchesKeyword(item, keyword) {
  if (!keyword?.trim()) return true
  if (!item || typeof item !== 'object') return false
  const blob = [
    item.title,
    item.enTitle,
    item.place,
    item.enPlace,
    item.name,
    item.sub,
    item.town,
    item.region,
    item.location,
    item.desc,
    item.route
  ]
    .filter(Boolean)
    .join(' ')
  return textMatchesKeyword(blob, keyword)
}

export { normalizeForSearch, tokenizeForSearch }
