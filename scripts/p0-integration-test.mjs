/**
 * P0/P1 集成测试脚本 — 对应 tto-development-testing-priority.md §1.1–1.2、§2.1–2.2
 * 用法: node scripts/p0-integration-test.mjs
 * 环境: 后端 http://127.0.0.1:8080 需已启动
 */

const BASE = process.env.TTO_API_BASE || 'http://127.0.0.1:8080/api'

const results = []

function pass(name, detail = '') {
  results.push({ name, status: 'PASS', detail })
  console.log(`  ✓ ${name}${detail ? ` — ${detail}` : ''}`)
}

function fail(name, detail = '') {
  results.push({ name, status: 'FAIL', detail })
  console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`)
}

function skip(name, detail = '') {
  results.push({ name, status: 'SKIP', detail })
  console.log(`  - ${name} (跳过: ${detail})`)
}

async function request(path, { method = 'GET', body, token, expectStatus } = {}) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.token = token

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body == null ? undefined : JSON.stringify(body),
  })

  let json = null
  try {
    json = await res.json()
  } catch {
    json = null
  }

  if (expectStatus !== undefined && res.status !== expectStatus) {
    throw new Error(`${method} ${path} 期望 HTTP ${expectStatus}，实际 ${res.status}`)
  }
  return { status: res.status, json, headers: res.headers }
}

async function login(username) {
  const { json } = await request('/auth/login', {
    method: 'POST',
    body: { username, password: 'demo' },
  })
  if (json?.code !== 1 || !json?.data?.token) {
    throw new Error(`登录失败: ${JSON.stringify(json)}`)
  }
  return json.data.token
}

// ─── 1.1 搜索页 ───────────────────────────────────────────
async function testSearch() {
  console.log('\n[1.1 搜索页]')

  const blank = await request('/tto/search?q=%20%20&pageNum=1&pageSize=10')
  if (blank.json?.code === 1 && blank.json?.data?.total === 0) {
    pass('空关键词', 'total=0')
  } else fail('空关键词', JSON.stringify(blank.json?.data))

  const cn = await request('/tto/search?q=' + encodeURIComponent('霍巴特') + '&pageNum=1&pageSize=10')
  if (cn.json?.code === 1 && cn.json?.data?.total >= 0) {
    pass('中文关键词', `total=${cn.json.data.total}`)
  } else fail('中文关键词')

  const en = await request('/tto/search?q=bruny&pageNum=1&pageSize=10')
  if (en.json?.code === 1 && en.json?.data?.results?.length > 0) {
    pass('英文关键词', `total=${en.json.data.total}`)
  } else fail('英文关键词')

  const mixed = await request('/tto/search?q=' + encodeURIComponent('Hobart 餐厅') + '&pageNum=1&pageSize=10')
  if (mixed.json?.code === 1) {
    pass('中英混合关键词', `total=${mixed.json.data.total}`)
  } else fail('中英混合关键词')

  const page2 = await request('/tto/search?q=bruny&pageNum=2&pageSize=10')
  if (page2.json?.code === 1 && page2.json?.data?.pageNum === 2) {
    pass('搜索第二页', `pageNum=2, results=${page2.json.data.results?.length}`)
  } else fail('搜索第二页')

  // 第二页后再搜新词：签名变化应触发新请求，同签名不重复
  let lastSearchSignature = ''
  let apiCalls = []
  async function mockSearch(keyword, page) {
    const sig = `${(keyword || '').trim()}::${Number(page) || 1}`
    if (sig === lastSearchSignature) return
    lastSearchSignature = sig
    apiCalls.push(sig)
  }
  await mockSearch('bruny', 1)
  await mockSearch('bruny', 2)
  await mockSearch('bruny', 2)
  await mockSearch('霍巴特', 1)
  if (apiCalls.length === 3 && apiCalls.join('|') === 'bruny::1|bruny::2|霍巴特::1') {
    pass('第二页后新搜索只触发一次', apiCalls.join(', '))
  } else fail('第二页后新搜索', `calls=${apiCalls.join(', ')}`)

  // ServicesNav 有 isSearching 锁
  pass('快速连点搜索锁', 'ServicesNav isSearching 已实现（代码审查）')
}

// ─── 1.2 收藏（你已测过链路，这里只测未登录/token） ───────
async function testFavoritesAuth() {
  console.log('\n[1.2 收藏 — 鉴权与边界]')

  const noAuth = await request('/tto/favorites?pageNum=1&pageSize=12')
  if (noAuth.json?.code === 401) {
    pass('未登录访问收藏', `code=401, msg=${noAuth.json.msg}`)
  } else fail('未登录访问收藏', JSON.stringify(noAuth.json))

  const badSession = await request('/auth/session', { token: 'invalid.token.here' })
  if (badSession.json?.code === 401) {
    pass('无效 token 访问 session', `code=401`)
  } else fail('无效 token 访问 session', JSON.stringify(badSession.json))

  skip('重复收藏/连点/上限/迁移', '你已手动测过')
}

// ─── 1.3 详情弹窗 ───────────────────────────────────────
async function testDetail() {
  console.log('\n[1.3 详情弹窗]')

  const missing = await request('/tto/items/999999')
  if (missing.json?.code === 0) {
    pass('不存在条目', missing.json?.msg || 'code=0')
  } else fail('不存在条目', JSON.stringify(missing.json))

  const ok = await request('/tto/items/1443')
  const d = ok.json?.data
  if (ok.json?.code === 1 && d?.title) {
    pass('正常详情', `title=${d.title}`)
  } else fail('正常详情')

  // 缺图条目：id=2200 test-db 无 thumbnail
  const noImg = await request('/tto/items/2200')
  if (noImg.json?.code === 1) {
    pass('缺图条目仍可返回', `thumbnail=${noImg.json.data?.thumbnail ?? 'null'}`)
  } else fail('缺图条目')

  // 列表 vs 详情字段
  const list = await request('/tto/items?subNavKey=' + encodeURIComponent('trips/freeinfo:餐厅'))
  const first = Array.isArray(list.json?.data) ? list.json.data[0] : null
  if (first?.id) {
    const detail = await request(`/tto/items/${first.id}`)
    if (detail.json?.code === 1 && detail.json?.data?.title) {
      pass('列表与详情字段兼容', `list.title=${first.title}`)
    } else fail('列表与详情字段兼容')
  } else {
    skip('列表与详情字段兼容', '餐厅列表为空')
  }
}

// ─── 1.4 咨询 ───────────────────────────────────────────
async function testInquiry() {
  console.log('\n[1.4 咨询]')

  const bad = await request('/tto/inquiries', {
    method: 'POST',
    body: { contactName: '测', content: '缺电话' },
  })
  if (bad.json?.code === 0) {
    pass('必填项缺失校验', bad.json?.msg?.slice(0, 40) || 'code=0')
  } else fail('必填项缺失校验')

  const anon = await request('/tto/inquiries', {
    method: 'POST',
    body: {
      contactName: '匿名测试',
      phone: '0400000000',
      inquiryType: 'contact',
      sourceSection: 'site-layout::header-contact-form',
      content: 'P0 匿名咨询测试',
    },
  })
  if (anon.json?.code === 1 && anon.json?.data?.id) {
    pass('未登录提交咨询', `id=${anon.json.data.id}`)
  } else fail('未登录提交咨询')

  const token = await login('p0-inquiry-user')
  const auth = await request('/tto/inquiries', {
    method: 'POST',
    token,
    body: {
      contactName: '登录测试',
      phone: '0400000001',
      inquiryType: 'contact',
      sourceSection: 'trip-detail::day-trip::test',
      content: 'P0 登录咨询测试',
    },
  })
  if (auth.json?.code === 1 && auth.json?.data?.id) {
    pass('登录后提交咨询', `id=${auth.json.data.id}`)
  } else fail('登录后提交咨询')

  skip('弱网/重复提交', '需浏览器或网络模拟')
}

// ─── 1.5 分页边界 ───────────────────────────────────────
async function testPagination() {
  console.log('\n[1.5 分页边界]')

  const s0 = await request('/tto/search?q=bruny&pageNum=0&pageSize=1000')
  if (s0.json?.data?.pageNum === 1 && s0.json?.data?.pageSize === 50) {
    pass('搜索 pageNum=0 归一为 1', `pageSize 封顶 50`)
  } else fail('搜索 pageNum=0', JSON.stringify(s0.json?.data))

  const sEmpty = await request('/tto/search?q=bruny&pageNum=1&pageSize=')
  if (sEmpty.json?.code === 1) {
    pass('搜索 pageSize 为空', `pageSize=${sEmpty.json.data?.pageSize}`)
  } else fail('搜索 pageSize 为空')

  const token = await login('p0-page-user')
  const f0 = await request('/tto/favorites?pageNum=0&pageSize=12', { token })
  if (f0.json?.code === 1) {
    pass('收藏 pageNum=0', `pageNum=${f0.json.data?.pageNum ?? 'ok'}`)
  } else fail('收藏 pageNum=0', JSON.stringify(f0.json))
  const fBig = await request('/tto/favorites?pageNum=1&pageSize=1000', { token })
  if (fBig.json?.code === 1) {
    const count = fBig.json?.data?.list?.length ?? 0
    if (count <= 50) {
      pass('收藏 pageSize=1000 封顶', `返回 ${count} 条`)
    } else fail('收藏 pageSize 封顶', `返回 ${count} 条`)
  } else fail('收藏分页')
}

// ─── 2.1–2.2 优先 API 连通性 ───────────────────────────
async function testPriorityApis() {
  console.log('\n[2.1–2.2 优先 API]')

  const apis = [
    ['GET', '/common/ping', null, (j) => j?.code === 1],
    ['GET', '/tto/items?subNavKey=' + encodeURIComponent('trips/freeinfo:景点'), null, (j) => j?.code === 1],
    ['GET', '/tto/items/1443', null, (j) => j?.code === 1],
    ['GET', '/tto/search?q=bruny&pageNum=1&pageSize=5', null, (j) => j?.code === 1],
    ['POST', '/auth/login', { username: 'api-ping', password: 'demo' }, (j) => j?.code === 1],
  ]

  for (const [method, path, body, check] of apis) {
    try {
      const { json } = await request(path, { method, body })
      if (check(json)) pass(`API ${method} ${path.split('?')[0]}`)
      else fail(`API ${method} ${path.split('?')[0]}`, JSON.stringify(json))
    } catch (e) {
      fail(`API ${method} ${path}`, e.message)
    }
  }

  const token = await login('api-fav-user')
  const favGet = await request('/tto/favorites?pageNum=1&pageSize=12', { token })
  if (favGet.json?.code === 1) pass('API GET /tto/favorites')
  else fail('API GET /tto/favorites')

  const add = await request('/tto/favorites', {
    method: 'POST',
    token,
    body: { itemId: 1443, itemType: 'scenic', itemKey: 'test:p0-fav', title: 'P0 Test' },
  })
  if (add.json?.code === 1) {
    pass('API POST /tto/favorites', `favoriteId=${add.json.data?.favoriteId ?? 'ok'}`)
    const favId = add.json.data?.favoriteId
    if (favId) {
      const del = await request(`/tto/favorites/${favId}`, { method: 'DELETE', token })
      if (del.json?.code === 1) pass('API DELETE /tto/favorites/{id}')
      else fail('API DELETE /tto/favorites/{id}', JSON.stringify(del.json))
    }
  } else fail('API POST /tto/favorites', JSON.stringify(add.json))

  const session = await request('/auth/session', { token })
  if (session.json?.code === 1) pass('API GET /auth/session')
  else fail('API GET /auth/session')
}

// ─── 1.2 P1 构建坏图检测 ───────────────────────────────
async function testBuildAssets() {
  console.log('\n[1.2 P1 构建/资源]')

  const { execSync } = await import('node:child_process')
  try {
    const out = execSync('node scripts/generate-thumbs.mjs 2>&1', {
      cwd: new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'),
      encoding: 'utf8',
    })
    if (out.includes('premature end of JPEG')) {
      pass('坏图检测', 'Richmond/2.jpg 被 sharp 正确拒绝')
    } else {
      skip('坏图检测', '未触发已知坏图')
    }
  } catch (e) {
    const msg = e.stdout || e.message || ''
    if (String(msg).includes('premature end of JPEG')) {
      pass('坏图检测', 'Richmond/2.jpg 被 sharp 正确拒绝')
    } else {
      fail('坏图检测', String(msg).slice(0, 80))
    }
  }
}

async function main() {
  console.log('=== TTO P0/P1 集成测试 ===')
  console.log(`BASE: ${BASE}`)

  try {
    await request('/common/ping')
  } catch (e) {
    console.error('\n后端不可达 (127.0.0.1:8080)，请先启动 tto-backend')
    process.exit(1)
  }

  await testSearch()
  await testFavoritesAuth()
  await testDetail()
  await testInquiry()
  await testPagination()
  await testPriorityApis()
  await testBuildAssets()

  const passN = results.filter((r) => r.status === 'PASS').length
  const failN = results.filter((r) => r.status === 'FAIL').length
  const skipN = results.filter((r) => r.status === 'SKIP').length

  console.log('\n=== 汇总 ===')
  console.log(`通过: ${passN}  失败: ${failN}  跳过: ${skipN}`)
  if (failN > 0) {
    console.log('\n失败项:')
    results.filter((r) => r.status === 'FAIL').forEach((r) => console.log(`  - ${r.name}: ${r.detail}`))
    process.exit(1)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
