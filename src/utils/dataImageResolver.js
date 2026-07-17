import defaultImg from '@/assets/img/default.png'
import defaultThumb from '@/assets/.optimized/img/default.thumb.webp'

const baseAssetModules = import.meta.glob('/src/assets/**/*.{png,jpg,jpeg,JPG,JPEG,gif,webp,svg,avif,AVIF}', {
  eager: true,
  import: 'default'
})

const optimizedAssetModules = import.meta.glob('/src/assets/.optimized/**/*.{webp,avif,AVIF}', {
  eager: true,
  import: 'default'
})

const assetModules = {
  ...baseAssetModules,
  ...optimizedAssetModules
}

const normalizeAssetPath = (inputPath) => {
  const raw = String(inputPath || '').trim()
  if (!raw) return ''

  // 兼容误拼写 ../assetes
  const normalizedRaw = raw.replace(/^(\.\.\/)assetes\//, '$1assets/')

  if (normalizedRaw.startsWith('/src/assets/')) return normalizedRaw
  if (normalizedRaw.startsWith('/assets/')) return `/src${normalizedRaw}`
  if (normalizedRaw.startsWith('assets/')) return `/src/${normalizedRaw}`
  if (normalizedRaw.startsWith('@/assets/')) return `/src/assets/${normalizedRaw.slice('@/assets/'.length)}`
  if (normalizedRaw.startsWith('../assets/')) return `/src/assets/${normalizedRaw.slice('../assets/'.length)}`

  return ''
}

const resolveAssetModule = (inputPath) => {
  const normalized = normalizeAssetPath(inputPath)
  if (!normalized) return ''

  // 仅按完整路径匹配；不按文件名兜底，避免 places/A/1.jpg 与 places/B/1.jpg 串图
  return assetModules[normalized] || ''
}

const getOptimizedAssetPath = (normalizedAssetPath, variant = 'thumb') => {
  if (!normalizedAssetPath.startsWith('/src/assets/')) return ''
  const relativePath = normalizedAssetPath.slice('/src/assets/'.length)
  const lastDotIndex = relativePath.lastIndexOf('.')
  if (lastDotIndex <= 0) return ''
  const pathWithoutExt = relativePath.slice(0, lastDotIndex)
  return `/src/assets/.optimized/${pathWithoutExt}.${variant}.webp`
}

const DEFAULT_FALLBACK = defaultThumb || defaultImg

const resolveDataImageCore = (inputPath, fallback, options = {}) => {
  const raw = String(inputPath || '').trim()
  if (!raw) return { src: fallback, resolvedFromModule: false, remote: false }

  if (/^(https?:|data:|blob:)/i.test(raw)) {
    return { src: raw, resolvedFromModule: false, remote: true }
  }

  const variant = String(options?.variant || 'original').trim().toLowerCase()
  const normalized = normalizeAssetPath(raw)
  if (normalized && variant !== 'original') {
    const optimizedPath = getOptimizedAssetPath(normalized, variant)
    const optimizedUrl = resolveAssetModule(optimizedPath)
    if (optimizedUrl) {
      return { src: optimizedUrl, resolvedFromModule: true, remote: false }
    }
  }

  const moduleUrl = resolveAssetModule(raw)
  if (moduleUrl) {
    return { src: moduleUrl, resolvedFromModule: true, remote: false }
  }

  // gh-pages 子路径部署兼容：/assets/... 需要补上 BASE_URL
  if (raw.startsWith('/assets/')) {
    return {
      src: `${import.meta.env.BASE_URL}${raw.slice(1)}`,
      resolvedFromModule: false,
      remote: false,
    }
  }
  if (raw.startsWith('/')) {
    return { src: raw, resolvedFromModule: false, remote: false }
  }

  return { src: fallback, resolvedFromModule: false, remote: false }
}

const resolveDataImage = (inputPath, fallback = DEFAULT_FALLBACK, options = {}) => {
  return resolveDataImageCore(inputPath, fallback, options).src
}

/**
 * 解析图片并返回是否使用了兜底图，供弹窗等场景展示「路径错误」提示。
 */
const resolveDataImageWithStatus = (inputPath, options = {}) => {
  const fallback = options.fallback ?? DEFAULT_FALLBACK
  const raw = String(inputPath || '').trim()
  if (!raw) {
    return {
      src: fallback,
      originalPath: '',
      usedFallback: false,
      isEmptyInput: true,
      errorReason: '',
    }
  }

  const { src, resolvedFromModule, remote } = resolveDataImageCore(raw, fallback, options)
  if (resolvedFromModule) {
    return { src, originalPath: raw, usedFallback: false, errorReason: '' }
  }
  if (remote) {
    return { src, originalPath: raw, usedFallback: false, errorReason: '', remote: true }
  }
  if (src !== fallback) {
    return { src, originalPath: raw, usedFallback: false, errorReason: '', remote: false }
  }

  return {
    src: fallback,
    originalPath: raw,
    usedFallback: true,
    errorReason: '图片路径无法解析',
  }
}

export {
  DEFAULT_FALLBACK as DEFAULT_DATA_IMAGE,
  resolveDataImage,
  resolveAssetModule,
  resolveDataImageWithStatus,
}
