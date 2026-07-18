/**
 * 将 split 产物同步到 gh-pages 使用的 fallback JSON。
 * 必须在 data:split + fix-scenic-locations + strip-location-labels 之后执行。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const PAIRS = [
  ['src/data/split/freeinfo.json', 'src/data/fallback/freeinfo_fallback.json'],
  ['src/data/split/daytrip.json', 'src/data/fallback/daytrip_fallback.json'],
]

for (const [relativeSource, relativeTarget] of PAIRS) {
  const sourcePath = path.join(root, relativeSource)
  const targetPath = path.join(root, relativeTarget)

  if (!fs.existsSync(sourcePath)) {
    console.warn(`[sync-fallback] skip (missing source): ${relativeSource}`)
    continue
  }

  fs.mkdirSync(path.dirname(targetPath), { recursive: true })
  fs.copyFileSync(sourcePath, targetPath)
  console.log(`[sync-fallback] ${relativeSource} -> ${relativeTarget}`)
}
