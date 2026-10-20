const LEGACY_PREFIX = '/DemoForTTO'

function readBasePrefix() { //读取部署路径
  //关于typeof import.meta的简单笔记见notes-for-code.md
  const raw = typeof import.meta !== 'undefined' ? (import.meta.env?.BASE_URL || '/') : '/'
  // 第一个和最后一个/是定界符，让JS知道这是个正则。真正的规则是"\/$"。唯一一个反斜杠是用来转义的，标明后面匹配的是一个普通斜杠。￥标明必须在字符串的末尾。
  // 用new RegExp('/$')更方便。
  const trimmed = String(raw).replace(/\/$/, '') //这里的正则表示结尾处的一个斜杠，删掉。/DemoForTTO/会变成/DemoForTTO
  return trimmed === '' ? '' : trimmed //返回空串表示部署在域名根目录，无前缀
}

export function isSiteRootPath(path) {//判断是不是网站根路径
  const value = String(path || '').split('?')[0]
  return value === '/' || value === '' || value === '/index.html' //？
}

/** 用途在路由守卫： 搜索引擎访客和首次访问者同等对待 ，
 * 落地到默认景点页而不是恢复某个 lastPath（因为他显然不是"回到上次浏览"的老用户）。 ? */
export function isSearchEngineReferrer() {
  if (typeof document === 'undefined') return false //false的话代表不是浏览器环境
  const referrer = document.referrer || '' //document.referrer是用户从哪个页面跳转过来的，为空表示直接访问当前页面
  if (!referrer) return false
  try {
    const host = new URL(referrer).hostname //取主机名如www.google.com
    return /(^|\.)(google|bing|baidu|yahoo|duckduckgo)\./i.test(host)
  } catch {
    return false
  }
}

/** 把历史 /DemoForTTO 前缀和 BASE_URL 收成 Vue Router 使用的 path+query。 */
//为什么这样做
export function normalizeAppPath(raw) {
  // 保证必须是非空字符串
  if (!raw || typeof raw !== 'string') return ''
  // 去掉#锚点，去掉空格
  let value = raw.split('#')[0].trim()
  if (!value) return ''

  /** 拿到原网址，先过滤了raw（raw也就是调用这个函数的时候传进来的网址），
   * 接着try：如果是可用的完整网址（不分大小写的http/https），用`new URL(value)`浏览器内置网址解析器，拆分网址。 */
  try {
    if (/^https?:\/\//i.test(value)) {
      const absolute = new URL(value)
      value = `${absolute.pathname}${absolute.search}`
    }
  } catch {
    // keep value
  }

  // 移除部署路径前缀 为什么？base是什么？
  const base = readBasePrefix()
  if (base && value === base) {
    value = '/'
  } else if (base && value.startsWith(`${base}/`)) {
    value = value.slice(base.length)
  }

  // 去掉历史 /DemoForTTO 前缀 为什么？
  if (value === LEGACY_PREFIX) {
    value = '/'
  } else if (value.startsWith(`${LEGACY_PREFIX}/`)) {
    value = value.slice(LEGACY_PREFIX.length)
  }

  if (!value.startsWith('/')) {
    value = `/${value}`
  }

  try {
    // 传入的第一个参数是相对路径(/about?x=1)的话，添加一个假域名，否则会报错，因为new URL()需要一个完整的网址
    const parsed = new URL(value, 'http://tto.local')
    // 输出标准/path?query
    return `${parsed.pathname}${parsed.search}`
  } catch {
    return value
  }
}

export function isRestorableAppPath(raw) {
  const value = normalizeAppPath(raw)
  if (!value) return false
  // 只要纯路径，不要查询串
  const pathname = value.split('?')[0]
  // 根路径不恢复，为什么？
  if (isSiteRootPath(pathname)) return false
  // 只允许真实存在的页面应用被恢复
  return /^\/(trips|favorites|service|search|info|about|contact|privacy|terms|refund)(\/|$)/.test(pathname)
}

export function isContentDetailPath(raw) {
  const pathname = normalizeAppPath(raw).split('?')[0]
  return pathname === '/info' || pathname.startsWith('/info/')
}

export function isFavoritesPath(raw) {
  const pathname = normalizeAppPath(raw).split('?')[0]
  return pathname === '/favorites' || pathname.startsWith('/favorites/')
}

export function isCompanyPagePath(raw) {
  const pathname = normalizeAppPath(raw).split('?')[0]
  return pathname === '/about'
    || pathname === '/contact'
    || pathname === '/privacy'
    || pathname === '/terms'
    || pathname === '/refund'
}

// 返回布尔值，调用它的函数（main.js）根据返回值判断是否需要固定滚动条到顶部
export function shouldPinScrollToTop(raw) {
  return isContentDetailPath(raw) || isFavoritesPath(raw) || isCompanyPagePath(raw)
}
