import dataSource from '@/data/data.json'

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

const pushResult = ({ title, summary, sectionTag, subNavName, groupName, targetUrl, source }) => {
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
    searchText: rawText.toLowerCase()
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
      source: item
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
          source: listItem
        })
      })
    }
  })
}

dataSource.forEach((section) => {
  // 检查section的isShow属性和available属性，如果存在且为false，则跳过
  if ((section.hasOwnProperty('isShow') && !section.isShow) || section.available === false) return

  const basePath = buildBasePath(section.path)
  const sectionText = collectStrings(section).join(' ')

  pushResult({
    title: section.tagName,
    summary: summaryFromItem(section),
    sectionTag: section.tagName,
    targetUrl: basePath,
    source: sectionText
  })

  if (Array.isArray(section.subNav)) {
    section.subNav.forEach((subNav) => {
      // 检查subNav的isShow属性，如果存在且为false，则跳过
      if (subNav.hasOwnProperty('isShow') && !subNav.isShow) return

      const queryKey = section.tagName === '一日游（固定行程）' ? 'dayTripTab' : 'subNavName'
      const queryParams = { [queryKey]: subNav.subNavName }

      pushResult({
        title: `${section.tagName} - ${subNav.subNavName}`,
        summary: summaryFromItem(subNav),
        sectionTag: section.tagName,
        subNavName: subNav.subNavName,
        targetUrl: buildTargetUrl(basePath, queryParams),
        source: subNav
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
      source: config
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

// 计算字符串相似度（简单实现，检查标题相似度）
const isSimilarTitle = (title1, title2) => {
  // 如果标题完全相同，直接认为相似
  if (title1 === title2) return true;

  // 如果一个标题是另一个标题的前缀（比如"私人定制" 和 "私人定制 - 介绍"）
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

export const searchAllContent = (rawKeyword) => {
  const keyword = cleanText(rawKeyword || '')
  if (!keyword) {
    return {
      query: '',
      results: []
    }
  }
  const lowerKeyword = keyword.toLowerCase()
  const results = searchIndex
    .map((item) => {
      // 检查item.source中的isShow属性，如果存在且为false，则跳过
      if (item.source && typeof item.source === 'object' && item.source.hasOwnProperty('isShow') && !item.source.isShow) {
        return null
      }

      const matchIndex = item.searchText.indexOf(lowerKeyword)
      if (matchIndex === -1) return null
      return {
        id: item.id,
        title: item.title,
        summary: item.summary,
        sectionTag: item.sectionTag,
        subNavName: item.subNavName,
        groupName: item.groupName,
        targetUrl: item.targetUrl,
        snippet: getSnippet(item.rawText, keyword),
        score: matchIndex
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.score - b.score)

  // 实现更严格的去重逻辑，特别是针对"私人定制"和"私人定制 - 介绍"这样的情况
  const uniqueResults = [];
  const seenContent = new Set();

  for (let i = 0; i < results.length; i++) {
    const currentResult = results[i];

    // 1. 对于有sectionTag的结果，使用sectionTag作为主要去重标识符
    // 这可以解决"私人定制"和"私人定制 - 介绍"这样的问题，因为它们通常有相同的sectionTag
    if (currentResult.sectionTag) {
      const sectionKey = currentResult.sectionTag;

      // 检查是否已经有相同sectionTag的结果
      if (!seenContent.has(sectionKey)) {
        seenContent.add(sectionKey);
        uniqueResults.push(currentResult);
      }
    }
    // 2. 对于没有sectionTag的结果，使用URL去重
    else if (!seenContent.has(currentResult.targetUrl)) {
      seenContent.add(currentResult.targetUrl);
      uniqueResults.push(currentResult);
    }
  }

  return {
    query: keyword,
    results: uniqueResults
  }
}

export const persistSearchSession = (payload) => {
  if (typeof window === 'undefined' || !payload) return
  try {
    localStorage.setItem(SEARCH_STORAGE_KEY, JSON.stringify({ ...payload, timestamp: Date.now() }))
  } catch (error) {
    console.error('保存搜索结果失败:', error)
  }
}

export const getStoredSearchSession = () => {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(SEARCH_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (error) {
    console.error('读取搜索记录失败:', error)
    return null
  }
}

export const clearStoredSearchSession = () => {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(SEARCH_STORAGE_KEY)
  } catch (error) {
    console.error('清除搜索记录失败:', error)
  }
}

export const SEARCH_PAGE_SIZE = 10

