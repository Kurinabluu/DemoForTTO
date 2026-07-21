/**
 * 地点邮编目录管理（模拟后台批量维护）
 *
 * 单一数据源：src/data/tas-location-postcodes.json
 * 前端 tasLocationPostcodes.js 直接 import 该 JSON；
 * sync-backend 会复制到 tto-backend。
 *
 * 用法：
 *   node scripts/location-catalog-admin.mjs scan
 *   node scripts/location-catalog-admin.mjs add Mangalore 7030 曼加洛尔
 *   node scripts/location-catalog-admin.mjs import path/to/batch.json [--apply]
 *   node scripts/location-catalog-admin.mjs sync-backend
 *
 * batch.json 格式：[{ "town": "Mangalore", "postcode": "7030", "nameZh": "曼加洛尔" }]
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const catalogPath = path.join(projectRoot, 'src/data/tas-location-postcodes.json')
const dataJsonPath = path.join(projectRoot, 'src/data/data.json')
const backendCatalogPath = path.resolve(projectRoot, '../tto-backend/src/main/resources/tto/tas-location-postcodes.json')

const SECTIONS = ['景点', '餐厅', '住宿']

function readCatalog() {
  return JSON.parse(fs.readFileSync(catalogPath, 'utf8'))
}

function writeCatalog(entries) {
  const sorted = [...entries].sort((a, b) => {
    const pc = String(a.postcode).localeCompare(String(b.postcode), 'en', { numeric: true })
    if (pc !== 0) return pc
    return String(a.town).localeCompare(String(b.town), 'en', { sensitivity: 'base' })
  })
  fs.writeFileSync(catalogPath, `${JSON.stringify(sorted, null, 2)}\n`, 'utf8')
  return sorted
}

function catalogKey(town, postcode) {
  return `${String(town).trim().toLowerCase()}|${String(postcode).trim()}`
}

function buildEntry(town, postcode, nameZh = '') {
  const t = String(town || '').trim()
  const p = String(postcode || '').trim()
  const zh = String(nameZh || '').trim() || t
  return { label: `${t} ${p}`, town: t, postcode: p, nameZh: zh }
}

function scanDataJson(catalog) {
  const known = new Set(catalog.map((row) => catalogKey(row.town, row.postcode)))
  const missing = new Map()
  const data = JSON.parse(fs.readFileSync(dataJsonPath, 'utf8'))
  const section = data.find((row) => row.tagName === '自助游/自驾游免费参考信息')
  if (!section?.subNav) return []

  section.subNav.forEach((sub) => {
    if (!SECTIONS.includes(sub.subNavName)) return
    ;(sub.items || []).forEach((item) => {
      const td = item.tripData || {}
      const town = String(td.town || '').trim()
      const postcode = String(td.postcode || '').trim()
      if (!town || !postcode) return
      const key = catalogKey(town, postcode)
      if (known.has(key) || missing.has(key)) return
      missing.set(key, { town, postcode, title: item.title || item.enTitle || '' })
    })
  })

  return [...missing.values()].sort((a, b) => {
    const pc = a.postcode.localeCompare(b.postcode, 'en', { numeric: true })
    if (pc !== 0) return pc
    return a.town.localeCompare(b.town, 'en', { sensitivity: 'base' })
  })
}

function addEntries(entriesToAdd) {
  const catalog = readCatalog()
  const known = new Set(catalog.map((row) => catalogKey(row.town, row.postcode)))
  let added = 0

  entriesToAdd.forEach(({ town, postcode, nameZh }) => {
    const key = catalogKey(town, postcode)
    if (known.has(key)) return
    catalog.push(buildEntry(town, postcode, nameZh))
    known.add(key)
    added += 1
  })

  if (added > 0) writeCatalog(catalog)
  return added
}

function syncBackend() {
  if (!fs.existsSync(backendCatalogPath)) {
    console.error(`[catalog-admin] backend catalog not found: ${backendCatalogPath}`)
    process.exit(1)
  }
  fs.copyFileSync(catalogPath, backendCatalogPath)
  console.log(`[catalog-admin] synced -> ${backendCatalogPath}`)
}

function printHelp() {
  console.log(`Usage:
  node scripts/location-catalog-admin.mjs scan
  node scripts/location-catalog-admin.mjs add <town> <postcode> [nameZh]
  node scripts/location-catalog-admin.mjs import <batch.json> [--apply]
  node scripts/location-catalog-admin.mjs sync-backend`)
}

const [command, ...args] = process.argv.slice(2)

if (!command || command === 'help' || command === '-h') {
  printHelp()
  process.exit(0)
}

if (command === 'scan') {
  const catalog = readCatalog()
  const missing = scanDataJson(catalog)
  console.log(`[catalog-admin] catalog entries: ${catalog.length}`)
  console.log(`[catalog-admin] missing in data.json: ${missing.length}`)
  missing.forEach((row) => {
    console.log(`  - ${row.town} ${row.postcode}  (${row.title})`)
  })
  if (missing.length) {
    console.log('\nBatch import template (save as batch.json, then import --apply):')
    console.log(JSON.stringify(missing.map(({ town, postcode }) => ({ town, postcode, nameZh: '' })), null, 2))
  }
  process.exit(0)
}

if (command === 'add') {
  const [town, postcode, nameZh] = args
  if (!town || !postcode) {
    printHelp()
    process.exit(1)
  }
  const added = addEntries([{ town, postcode, nameZh }])
  console.log(added ? `[catalog-admin] added ${town} ${postcode}` : `[catalog-admin] already exists: ${town} ${postcode}`)
  process.exit(0)
}

if (command === 'import') {
  const apply = args.includes('--apply')
  const fileArg = args.find((arg) => arg !== '--apply')
  if (!fileArg) {
    printHelp()
    process.exit(1)
  }
  const filePath = path.resolve(process.cwd(), fileArg)
  const batch = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  if (!Array.isArray(batch)) {
    console.error('[catalog-admin] batch file must be a JSON array')
    process.exit(1)
  }
  if (!apply) {
    console.log(`[catalog-admin] dry-run: would add ${batch.length} entries from ${filePath}`)
    batch.forEach((row) => console.log(`  - ${row.town} ${row.postcode} ${row.nameZh || ''}`))
    console.log('Run again with --apply to write catalog.')
    process.exit(0)
  }
  const added = addEntries(batch)
  console.log(`[catalog-admin] imported ${added} new entries`)
  process.exit(0)
}

if (command === 'sync-backend') {
  syncBackend()
  process.exit(0)
}

printHelp()
process.exit(1)
