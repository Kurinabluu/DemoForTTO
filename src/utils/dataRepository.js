let dataJsonCache = null
let dataJsonPromise = null

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

export { getDataJson }
