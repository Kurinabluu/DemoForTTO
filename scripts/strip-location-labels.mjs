/**
 * 方案 B：从 JSON 源文件移除 tripData.locationLabel（运行时由 town+postcode 派生）。
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const TARGETS = [
  path.join(root, 'src/data/split/freeinfo.json'),
  path.join(root, 'src/data/data.json'),
  path.join(root, 'src/data/fallback/freeinfo_fallback.json'),
]

function stripFromFreeinfo(doc) {
  let removed = 0
  const subNav = doc?.subNav
  if (!Array.isArray(subNav)) return removed
  for (const section of subNav) {
    for (const item of section.items || []) {
      const td = item?.tripData
      if (td && ('locationLabel' in td)) {
        delete td.locationLabel
        removed += 1
      }
    }
  }
  return removed
}

function stripFromDataJson(doc) {
  let removed = 0
  if (!Array.isArray(doc)) return removed
  for (const block of doc) {
    removed += stripFromFreeinfo(block)
  }
  return removed
}

for (const filePath of TARGETS) {
  if (!fs.existsSync(filePath)) {
    console.log('skip (missing):', filePath)
    continue
  }
  const raw = fs.readFileSync(filePath, 'utf8')
  const doc = JSON.parse(raw)
  const removed = filePath.endsWith('data.json')
    ? stripFromDataJson(doc)
    : stripFromFreeinfo(doc)
  fs.writeFileSync(filePath, `${JSON.stringify(doc, null, filePath.includes('data.json') ? 4 : 2)}\n`, 'utf8')
  console.log(`stripped ${removed} locationLabel from ${path.relative(root, filePath)}`)
}
