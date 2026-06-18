import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { inferItemLocation, resolveLocationLabel, UNCATEGORIZED_LOCATION } from '../src/utils/tasLocationPostcodes.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const freeinfoPath = path.resolve(__dirname, '../src/data/split/freeinfo.json')

const SECTIONS = ['景点', '餐厅', '住宿']

const raw = fs.readFileSync(freeinfoPath, 'utf8')
const data = JSON.parse(raw)

let belongsToSpotCount = 0
let townFilled = 0
let regionRemoved = 0
let uncategorized = 0
let legacyRemoved = 0

SECTIONS.forEach((sectionName) => {
  const section = data.subNav.find((entry) => entry.subNavName === sectionName)
  if (!section?.items) return

  section.items.forEach((item) => {
    if (!item.tripData || typeof item.tripData !== 'object') {
      item.tripData = {}
    }
    const tripData = item.tripData
    const { town, belongsToSpot } = inferItemLocation(item)

    if (belongsToSpot) {
      tripData.belongsToSpot = belongsToSpot
      belongsToSpotCount += 1
    } else {
      delete tripData.belongsToSpot
    }

    delete tripData.belongsToTown
    if (item.belongsToTown) {
      delete item.belongsToTown
      legacyRemoved += 1
    }
    if (tripData.belongsToTown) {
      legacyRemoved += 1
    }

    if (town) {
      tripData.town = town
      townFilled += 1
    } else {
      delete tripData.town
    }

    if (tripData.region) {
      delete tripData.region
      regionRemoved += 1
    }

    if (resolveLocationLabel(item) === UNCATEGORIZED_LOCATION) {
      uncategorized += 1
    }
  })
})

fs.writeFileSync(freeinfoPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')

console.log(`Sections updated: ${SECTIONS.join(', ')}`)
console.log(`belongsToSpot set: ${belongsToSpotCount}`)
console.log(`town set: ${townFilled}`)
console.log(`legacy belongsToTown removed: ${legacyRemoved}`)
console.log(`region removed: ${regionRemoved}`)
console.log(`still uncategorized: ${uncategorized}`)
