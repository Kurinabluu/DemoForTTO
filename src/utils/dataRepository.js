let dataJsonCache = null
let dataJsonPromise = null
let searchIndexCache = null
let searchIndexPromise = null

async function getDataJson() {
  if (Array.isArray(dataJsonCache)) {
    return dataJsonCache
  }

  if (!dataJsonPromise) {
    dataJsonPromise = import('@/data/data.json')
      .then((mod) => {
        const loaded = Array.isArray(mod?.default) ? mod.default : []
        dataJsonCache = loaded
        return loaded
      })
      .catch(() => {
        dataJsonCache = []
        return []
      })
  }

  return dataJsonPromise
}

async function getSearchIndexData() {
  if (Array.isArray(searchIndexCache)) {
    return searchIndexCache
  }

  if (!searchIndexPromise) {
    searchIndexPromise = import('@/data/split/search-index.json')
      .then((mod) => {
        const loaded = Array.isArray(mod?.default) ? mod.default : []
        searchIndexCache = loaded
        return loaded
      })
      .catch(() => {
        searchIndexCache = []
        return []
      })
  }

  return searchIndexPromise
}

export { getDataJson, getSearchIndexData }
