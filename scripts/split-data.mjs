import fs from 'node:fs/promises'
import path from 'node:path'
import {
  buildTourDialogQueryParams,
  shouldAttachTourDialogLocate
} from '../src/utils/searchItemKey.js'
import { buildDayTripTabQuery } from '../src/utils/subNavKey.js'

const projectRoot = process.cwd()
const dataFilePath = path.join(projectRoot, 'src', 'data', 'data.json')
const splitDirPath = path.join(projectRoot, 'src', 'data', 'split')

const FREEINFO_TAG = '自助游/自驾游免费参考信息'
const DAYTRIP_TAG = '一日游/多日游'
const SERVICE_TAGS = new Set(['热门项目', '商务接送', '包车服务', '专属定制', '地接地陪', '行程管家'])
const SEARCH_IGNORE_KEYS = new Set(['id', 'img', 'icon', 'heroImg', 'url', 'path'])

function buildNavMeta(dataSource = []) {
  return dataSource.map((item) => ({
    tagName: item?.tagName || '',
    path: item?.path || '',
    available: item?.available,
    hasSubNav: !!item?.hasSubNav,
    isTrip: item?.isTrip,
    subNav: Array.isArray(item?.subNav)
      ? item.subNav.map((sub) => ({
          subNavName: sub?.subNavName || '',
          isShow: sub?.isShow
        }))
      : []
  }))
}

function cleanText(value) {
  if (typeof value !== 'string') return ''
  return value.replace(/\s+/g, ' ').trim()
}

function collectStrings(value, collector = [], key = '') {
  if (!value && value !== 0) return collector
  if (typeof value === 'boolean') return collector
  if (key && SEARCH_IGNORE_KEYS.has(key)) return collector

  if (typeof value === 'string' || typeof value === 'number') {
    if (key === 'id') return collector
    const text = cleanText(value.toString())
    if (text) collector.push(text)
    return collector
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectStrings(item, collector, key))
    return collector
  }

  if (typeof value === 'object') {
    Object.entries(value).forEach(([childKey, childValue]) => collectStrings(childValue, collector, childKey))
  }
  return collector
}

function buildBasePath(sectionPath) {
  if (!sectionPath) return '/DemoForTTO'
  const normalized = sectionPath.startsWith('/') ? sectionPath : `/${sectionPath}`
  return `/DemoForTTO${normalized}`
}

function buildTargetUrl(basePath, params = {}) {
  const url = new URL(basePath, 'http://placeholder.host')
  const searchParams = new URLSearchParams(url.search)
  Object.entries(params).forEach(([key, value]) => {
    if (value) searchParams.set(key, value)
  })
  const queryString = searchParams.toString()
  return queryString ? `${url.pathname}?${queryString}` : url.pathname
}

function summaryFromItem(item) {
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

function createSearchIndexRows(dataSource = []) {
  let idCounter = 0
  const rows = []
  const nextId = () => {
    idCounter += 1
    return `search-item-${idCounter}`
  }

  const pushResult = ({
    title,
    summary,
    sectionTag,
    subNavName,
    groupName,
    targetUrl,
    source,
    kind = 'item'
  }) => {
    if (!title || !targetUrl) return
    const rawText = collectStrings(source || summary || title).join(' ')
    rows.push({
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
      if (!item || typeof item !== 'object' || (item.hasOwnProperty('isShow') && !item.isShow)) return
      const baseTitle = item.title || item.place || item.name || item.route || item.subNavName
      const summary = summaryFromItem(item)
      const itemParams = shouldAttachTourDialogLocate(context.sectionTag)
        ? buildTourDialogQueryParams(item, context.queryParams || {})
        : { ...(context.queryParams || {}) }
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
          if (listItem?.hasOwnProperty('isShow') && !listItem.isShow) return
          const listTitle = listItem.title || listItem.name || listItem.place
          const listParams = shouldAttachTourDialogLocate(context.sectionTag)
            ? buildTourDialogQueryParams(listItem, context.queryParams || {})
            : { ...(context.queryParams || {}) }
          pushResult({
            title: listTitle,
            summary: summaryFromItem(listItem),
            sectionTag: context.sectionTag,
            subNavName: context.subNavName,
            groupName: item.place || context.groupName,
            targetUrl: buildTargetUrl(context.basePath, listParams),
            source: listItem,
            kind: 'item'
          })
        })
      }
    })
  }

  dataSource.forEach((section) => {
    if ((section?.hasOwnProperty('isShow') && !section.isShow) || section?.available === false) return
    const basePath = buildBasePath(section.path)
    const sectionText = [section.tagName, summaryFromItem(section), section.heroDesc, section.description]
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
        if (subNav?.hasOwnProperty('isShow') && !subNav.isShow) return
        const queryKey = section.tagName === DAYTRIP_TAG ? 'dayTripTab' : 'subNavName'
        const queryParams = {
          [queryKey]: section.tagName === DAYTRIP_TAG
            ? buildDayTripTabQuery(subNav.subNavName)
            : subNav.subNavName
        }
        pushResult({
          title: `${section.tagName} - ${subNav.subNavName}`,
          summary: summaryFromItem(subNav),
          sectionTag: section.tagName,
          subNavName: subNav.subNavName,
          targetUrl: buildTargetUrl(basePath, queryParams),
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

      processItemsArray(config.packages, { sectionTag: section.tagName, basePath })
      processItemsArray(config.advantages, { sectionTag: section.tagName, basePath })
    }
  })

  return rows
}

async function writeJsonFile(targetPath, content) {
  const serialized = `${JSON.stringify(content, null, 2)}\n`
  await fs.writeFile(targetPath, serialized, 'utf8')
}

async function main() {
  const raw = await fs.readFile(dataFilePath, 'utf8')
  const dataSource = JSON.parse(raw)
  const freeInfo = dataSource.find((item) => item?.tagName === FREEINFO_TAG) || null
  const dayTrip = dataSource.find((item) => item?.tagName === DAYTRIP_TAG) || null
  const services = dataSource.filter((item) => SERVICE_TAGS.has(item?.tagName))
  const navMeta = buildNavMeta(dataSource)
  const searchIndex = createSearchIndexRows(dataSource)

  await fs.mkdir(splitDirPath, { recursive: true })
  await Promise.all([
    writeJsonFile(path.join(splitDirPath, 'freeinfo.json'), freeInfo),
    writeJsonFile(path.join(splitDirPath, 'daytrip.json'), dayTrip),
    writeJsonFile(path.join(splitDirPath, 'services.json'), services),
    writeJsonFile(path.join(splitDirPath, 'nav.json'), navMeta),
    writeJsonFile(path.join(splitDirPath, 'search-index.json'), searchIndex)
  ])

  console.log(`[data-split] done. freeinfo=${!!freeInfo}, daytrip=${!!dayTrip}, services=${services.length}, nav=${navMeta.length}, searchIndex=${searchIndex.length}`)
}

main().catch((error) => {
  console.error('[data-split] fatal error:', error)
  process.exitCode = 1
})
