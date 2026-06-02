import { getDataJson, getSearchIndexData } from '@/utils/dataRepository'

const SEARCH_STORAGE_KEY = 'tto_last_search_payload'
const MAX_SNIPPET_LENGTH = 220

const cleanText = (value) => {
  if (typeof value !== 'string') return ''
  return value.replace(/\s+/g, ' ').trim()
}

// 不希望出现在 snippet 里的字段 key
const IGNORE_KEYS = new Set(['id', 'img', 'icon', 'heroImg', 'url', 'path'])

// 递归收集用于搜索与 snippet 的文本，过滤掉图片路径、颜色值等技术字段
const collectStrings = (value, collector = [], key = '') => {
  if (!value && value !== 0) {
    return collector
  }

  // 忽略布尔值
  if (typeof value === 'boolean') {
    return collector
  }

  // 忽略特定 key（如 id/img/icon/heroImg/url）对应的所有内容
  if (key && IGNORE_KEYS.has(key)) {
    return collector
  }

  if (typeof value === 'string' || typeof value === 'number') {
    // 如果是 id 字段里的数字，同样跳过
    if (key === 'id') return collector

    const text = cleanText(value.toString())
    if (text) {
      collector.push(text)
    }
    return collector
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectStrings(item, collector, key))
    return collector
  }

  if (typeof value === 'object') {
    Object.entries(value).forEach(([childKey, childValue]) =>
      collectStrings(childValue, collector, childKey)
    )
  }
  return collector
}

const buildBasePath = (sectionPath) => {
  if (!sectionPath) return '/DemoForTTO'
  const normalized = sectionPath.startsWith('/') ? sectionPath : `/${sectionPath}`
  return `/DemoForTTO${normalized}`
}

const buildTargetUrl = (basePath, params = {}) => {
  const url = new URL(basePath, 'http://placeholder.host')
  const searchParams = new URLSearchParams(url.search)
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value)
    }
  })
  const queryString = searchParams.toString()
  return queryString ? `${url.pathname}?${queryString}` : url.pathname
}

const summaryFromItem = (item) => {
  if (!item || typeof item !== 'object') return ''
  return (
    item.desc ||
    item.sub ||
    item.summary ||
    item.tripData?.desc ||
    item.tripData?.route ||
    item.description ||
    item.heroDesc ||
    item.text ||
    ''
  )
}

let idCounter = 0
const nextId = () => {
  idCounter += 1
  return `search-item-${idCounter}`
}

const searchIndex = []
let hasBuiltSearchIndex = false
let buildSearchIndexPromise = null

const pushResult = ({
  title,
  summary,
  sectionTag,
  subNavName,
  groupName,
  targetUrl,
  source,
  kind = 'item' // section | subNav | service | item
}) => {
  if (!title || !targetUrl) return
  const rawText = collectStrings(source || summary || title).join(' ')
  searchIndex.push({
    id: nextId(),
    title,
    summary: summary ? cleanText(summary) : '',
    sectionTag,
    subNavName,
    groupName,
    targetUrl,
    rawText,
    searchText: rawText.toLowerCase(),
    kind
  })
}

const processItemsArray = (items, context = {}) => {
  if (!Array.isArray(items)) return
  items.forEach((item) => {
    // 检查isShow属性，如果存在且为false，则跳过
    if (!item || typeof item !== 'object' || (item.hasOwnProperty('isShow') && !item.isShow)) return

    const baseTitle = item.title || item.place || item.name || item.route || item.subNavName
    const summary = summaryFromItem(item)

    // 构建包含元素标识和弹窗类型的URL参数
    const itemParams = {
      ...context.queryParams || {},
      dialogItemId: item.title ? encodeURIComponent(item.title) : undefined,
      dialogType: 'tour' // 默认弹窗类型
    }

    pushResult({
      title: baseTitle,
      summary,
      sectionTag: context.sectionTag,
      subNavName: context.subNavName,
      groupName: context.groupName,
      targetUrl: buildTargetUrl(context.basePath, itemParams),
      source: item,
      kind: 'item'
    })

    if (Array.isArray(item.list)) {
      item.list.forEach((listItem) => {
        // 检查listItem的isShow属性，如果存在且为false，则跳过
        if (listItem.hasOwnProperty('isShow') && !listItem.isShow) return

        const listTitle = listItem.title || listItem.name || listItem.place
        pushResult({
          title: listTitle,
          summary: summaryFromItem(listItem),
          sectionTag: context.sectionTag,
          subNavName: context.subNavName,
          groupName: item.place || context.groupName,
          targetUrl: buildTargetUrl(context.basePath, context.queryParams || {}),
          source: listItem,
          kind: 'item'
        })
      })
    }
  })
}

const buildSearchIndex = (dataSource = []) => {
  searchIndex.length = 0
  idCounter = 0

  dataSource.forEach((section) => {
    // 检查section的isShow属性和available属性，如果存在且为false，则跳过
    if ((section.hasOwnProperty('isShow') && !section.isShow) || section.available === false) return

    const basePath = buildBasePath(section.path)
    // 只索引板块自身的文字，不把所有子项的内容都算进来，
    // 避免搜索“inn”等关键词时，把下面所有景点/酒店的词都算到这一层上
    const sectionText = [
      section.tagName,
      summaryFromItem(section),
      section.heroDesc,
      section.description
    ]
      .filter(Boolean)
      .map((v) => cleanText(String(v)))
      .join(' ')

    pushResult({
      title: section.tagName,
      summary: summaryFromItem(section),
      sectionTag: section.tagName,
      targetUrl: basePath,
      source: sectionText,
      kind: 'section'
    })

    if (Array.isArray(section.subNav)) {
      section.subNav.forEach((subNav) => {
        // 检查subNav的isShow属性，如果存在且为false，则跳过
        if (subNav.hasOwnProperty('isShow') && !subNav.isShow) return

        const queryKey = section.tagName === '一日游/多日游' ? 'dayTripTab' : 'subNavName'
        const queryParams = { [queryKey]: subNav.subNavName }

        pushResult({
          title: `${section.tagName} - ${subNav.subNavName}`,
          summary: summaryFromItem(subNav),
          sectionTag: section.tagName,
          subNavName: subNav.subNavName,
          targetUrl: buildTargetUrl(basePath, queryParams),
          // 这里同样只索引子导航自身的简介，不包含 items 里的每个景点/酒店，
          // 否则会出现“景点外面包一层”的结果一起命中
          source: {
            subNavName: subNav.subNavName,
            desc: subNav.desc,
            summary: summaryFromItem(subNav)
          },
          kind: 'subNav'
        })

        if (Array.isArray(subNav.items)) {
          processItemsArray(subNav.items, {
            sectionTag: section.tagName,
            subNavName: subNav.subNavName,
            basePath,
            groupName: subNav.subNavName,
            queryParams
          })
        }
      })
    }

    if (Array.isArray(section.tripConfig)) {
      processItemsArray(section.tripConfig, {
        sectionTag: section.tagName,
        basePath
      })
    }

    if (section.serviceConfig) {
      const config = section.serviceConfig
      pushResult({
        title: `${section.tagName} - 介绍`,
        summary: config.heroDesc || config.contactIntro || summaryFromItem(config),
        sectionTag: section.tagName,
        targetUrl: basePath,
        source: config,
        kind: 'service'
      })

      processItemsArray(config.packages, {
        sectionTag: section.tagName,
        basePath
      })

      processItemsArray(config.advantages, {
        sectionTag: section.tagName,
        basePath
      })
    }
  })
}

const ensureSearchIndex = async () => {
  if (hasBuiltSearchIndex) return

  if (!buildSearchIndexPromise) {
    buildSearchIndexPromise = getSearchIndexData()
      .then((rows) => {
        if (Array.isArray(rows) && rows.length > 0) {
          searchIndex.length = 0
          rows.forEach((row) => {
            if (!row || typeof row !== 'object') return
            const rawText = typeof row.rawText === 'string' ? row.rawText : collectStrings(row).join(' ')
            searchIndex.push({
              id: row.id || nextId(),
              title: row.title || '',
              summary: row.summary || '',
              sectionTag: row.sectionTag || '',
              subNavName: row.subNavName || '',
              groupName: row.groupName || '',
              targetUrl: row.targetUrl || '',
              rawText,
              searchText: (row.searchText || rawText || '').toLowerCase(),
              kind: row.kind || 'item'
            })
          })
          hasBuiltSearchIndex = true
          return
        }

        return getDataJson().then((dataSource) => {
          buildSearchIndex(dataSource)
          hasBuiltSearchIndex = true
        })
      })
      .catch(() => {
        buildSearchIndex([])
        hasBuiltSearchIndex = true
      })
  }

  await buildSearchIndexPromise
}

const getSnippet = (text, keyword) => {
  if (!text) return ''
  const lowerText = text.toLowerCase()
  const lowerKeyword = keyword.toLowerCase()
  const index = lowerText.indexOf(lowerKeyword)
  if (index === -1) {
    return text.length > MAX_SNIPPET_LENGTH ? `${text.slice(0, MAX_SNIPPET_LENGTH)}...` : text
  }
  const start = Math.max(index - 80, 0)
  const end = Math.min(index + lowerKeyword.length + 80, text.length)
  const prefix = start > 0 ? '...' : ''
  const suffix = end < text.length ? '...' : ''
  return `${prefix}${text.slice(start, end)}${suffix}`
}

// ---- 全站搜索：英文单词级模糊匹配（支持 wonders / wonder 等） ----
const normalizeForSearch = (str) => (str || '').toLowerCase()

const isAsciiToken = (token) => /^[a-z0-9]+$/i.test(token)

const tokenizeForSearch = (str) =>
  normalizeForSearch(str)
    .split(/[\s,./\\\-+()'"“”‘’!?;:]+/)
    .filter(Boolean)

const buildEffectiveQueryTokens = (keyword) => {
  const rawTokens = tokenizeForSearch(keyword)
  const compactQuery = normalizeForSearch(keyword).replace(/\s+/g, '')

  // 英文/数字词至少 2 个字符，避免 "r i c h..." 把单字母当关键词
  const filtered = rawTokens.filter((token) => {
    if (isAsciiToken(token)) return token.length >= 2
    return token.length >= 1
  })

  // 兜底：如果被过滤后为空，则按整体词匹配
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

const evaluateSearchTextMatch = (text, keyword) => {
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
  const allTokensHit = kwTokens.every((kwTok) => tokenMatchesWord(kwTok, words, textNorm))
  return allTokensHit
}

const textMatchesKeyword = (text, keyword) => evaluateSearchTextMatch(text, keyword)

// 计算字符串相似度（简单实现，检查标题相似度）
const isSimilarTitle = (title1, title2) => {
  // 如果标题完全相同，直接认为相似
  if (title1 === title2) return true;

  // 如果一个标题是另一个标题的前缀（比如"专属定制" 和 "专属定制 - 介绍"）
  const shortTitle = title1.length < title2.length ? title1 : title2;
  const longTitle = title1.length < title2.length ? title2 : title1;

  // 检查短标题是否是长标题的开头，并且长标题只是添加了一些描述性文字
  if (longTitle.startsWith(shortTitle) &&
    (longTitle.length - shortTitle.length) <= 20 && // 长度差异不大
    (longTitle.includes('-') || longTitle.includes('：'))) {
    return true;
  }

  return false;
}

export const searchAllContent = async (rawKeyword) => {
  await ensureSearchIndex()
  const keyword = cleanText(rawKeyword || '')
  if (!keyword) {
    return {
      query: '',
      results: []
    }
  }
  const results = searchIndex
    .map((item) => {
      // 1. 过滤掉外层“容器类”的结果（板块、本分类标题等），只保留具体条目
      if (item.kind === 'section' || item.kind === 'subNav') {
        return null
      }

      // 2. 使用单词级模糊匹配判断是否命中（支持 wonders / wonder 等）
      if (!textMatchesKeyword(item.searchText, keyword)) return null

      // 3. 依然尝试用原始关键字定位第一次出现的位置，用于排序与 snippet
      const lowerKeyword = keyword.toLowerCase()
      const matchIndex = item.searchText.indexOf(lowerKeyword)
      return {
        id: item.id,
        title: item.title,
        summary: item.summary,
        sectionTag: item.sectionTag,
        subNavName: item.subNavName,
        groupName: item.groupName,
        targetUrl: item.targetUrl,
        snippet: getSnippet(item.rawText, keyword),
        // 如果没有完全匹配的子串，给一个较大的分值，保证排在稍后
        score: matchIndex === -1 ? Number.MAX_SAFE_INTEGER : matchIndex
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.score - b.score)

  return {
    query: keyword,
    results
  }
}

export const persistSearchSession = (payload) => {
  if (typeof window === 'undefined' || !payload) return
  try {
    localStorage.setItem(SEARCH_STORAGE_KEY, JSON.stringify({ ...payload, timestamp: Date.now() }))
  } catch (error) {
    // 保存搜索结果失败
  }
}

export const getStoredSearchSession = () => {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(SEARCH_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (error) {
    return null
  }
}

export const clearStoredSearchSession = () => {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(SEARCH_STORAGE_KEY)
  } catch (error) {
    // 清除搜索记录失败
  }
}

export const SEARCH_PAGE_SIZE = 10

