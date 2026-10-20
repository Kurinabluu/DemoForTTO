import { defineStore } from 'pinia'
import { normalizeAppPath, shouldPinScrollToTop } from '@/utils/appPath'

const STORAGE_KEYS = {
    firstVisit: 'tto_first_visit_done',
    lastPath: 'tto_last_path', // 保存完整路由路径（用于路由恢复）
    lastScrollY: 'tto_last_scroll_y', // 兼容旧版：最近一次滚动位置
    scrollByPath: 'tto_scroll_by_path', // 按路由保存滚动位置
    selectedSubNav: 'tto_selected_subnav', // 保存选中的子导航（仍然需要用于子导航状态）
}

const MAX_SCROLL_PATH_ENTRIES = 30

function normalizeRoutePath(path) {
    return normalizeAppPath(path) || ''
}

// 滚动字典的 key 策略：
// 1) 剥离搜索关键词参数 s —— 搜索结果页每次关键词都不同，且恢复侧（main.js）
//    本来就对带 ?s= 的路由强制回顶部，记住它只会制造永远不会命中的 key；
// 2) 保留 subNavName 等有限枚举参数，切换子标签时可以各自恢复位置。
function scrollKeyFromPath(path) {
    const normalized = normalizeRoutePath(path)
    if (!normalized || normalized.indexOf('?') === -1) return normalized

    const separator = normalized.indexOf('?')
    const pathname = normalized.slice(0, separator)
    const keptQuery = normalized
        .slice(separator + 1)
        .split('&')
        .filter((pair) => {
            const name = pair.split('=')[0]
            return name && name !== 's'
        })
        .join('&')
    return keptQuery ? `${pathname}?${keptQuery}` : pathname
}

function readScrollMap() {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.scrollByPath)
        if (!raw) return {}
        const parsed = JSON.parse(raw)
        return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
        return {}
    }
}

function writeScrollMap(map) {
    try {
        localStorage.setItem(STORAGE_KEYS.scrollByPath, JSON.stringify(map))
    } catch {
        // 隐私模式/存储已满：放弃本次持久化，内存状态仍正常工作
    }
}

// 修建滚动字典tto_scroll_by_path
function pruneScrollMap(map) {
    const keys = Object.keys(map)
    if (keys.length <= MAX_SCROLL_PATH_ENTRIES) return map
    keys.slice(0, keys.length - MAX_SCROLL_PATH_ENTRIES).forEach((key) => {
        delete map[key]
    })
    return map
}

export const useNavStore = defineStore('nav', {
    state: () => ({
        lastPath: localStorage.getItem(STORAGE_KEYS.lastPath) || '',
        lastScrollY: Number(localStorage.getItem(STORAGE_KEYS.lastScrollY) || 0),
        scrollByPath: readScrollMap(),
        selectedSubNav: localStorage.getItem(STORAGE_KEYS.selectedSubNav) || '',
        isRestoringScroll: false,
        resetScrollOnNextRoute: false,
    }),
    actions: {
        markFirstVisitDone() {
            this.safeSetItem(STORAGE_KEYS.firstVisit, '1')
        },
        isFirstVisit() {
            return !localStorage.getItem(STORAGE_KEYS.firstVisit)
        },

        // 保存完整路由路径（用于路由恢复，移除#top锚点）
        savePath(path) {
            const pathWithoutAnchor = normalizeRoutePath(path)
            this.lastPath = pathWithoutAnchor
            this.safeSetItem(STORAGE_KEYS.lastPath, pathWithoutAnchor)
        },

        getScrollForPath(path) {
            const key = scrollKeyFromPath(path)
            const map = readScrollMap()
            if (key && map[key] != null) {
                return Math.max(0, Number(map[key]) || 0)
            }

            const lastPath = normalizeRoutePath(this.lastPath || localStorage.getItem(STORAGE_KEYS.lastPath) || '')
            if (key && key === lastPath) {
                return Math.max(0, Number(localStorage.getItem(STORAGE_KEYS.lastScrollY) || this.lastScrollY) || 0)
            }
            return 0
        },

        // y：滚动条距离顶部的像素值；path：这次滚动发生在哪个地址（取 fullPath）
        saveScroll(y, path) {
            // 程序在恢复滚动，此时浏览器自发触发的 scroll 事件不许写，避免覆盖目标位置
            if (this.isRestoringScroll) return
            // 洗成非负数
            const val = Math.max(0, Number(y || 0))
            // path 缺省时退回最后记录的地址；key 还会剥掉搜索关键词参数
            const key = scrollKeyFromPath(path || this.lastPath)
            // 旧版单数字字段照常写（getScrollForPath 里还有兜底读取）
            this.lastScrollY = val
            this.safeSetItem(STORAGE_KEYS.lastScrollY, String(val))

            if (!key) return

            const map = pruneScrollMap(readScrollMap())

            // 两种情况字典“不写入 + 顺手删旧记录”：
            // 1) 页面类别不该被记住（公司页/详情页/收藏页，恢复侧本就强制回顶部）；
            // 2) 值为 0 —— 读到 0 与“查无记录”的恢复效果完全相同（getScrollForPath 默认返回 0）。
            // 两个维度互相独立、叠加生效
            if (shouldPinScrollToTop(key) || val === 0) {
                if (Object.prototype.hasOwnProperty.call(map, key)) {
                    delete map[key]
                    writeScrollMap(map)
                    this.scrollByPath = { ...map }
                }
                return
            }

            map[key] = val
            writeScrollMap(map)
            this.scrollByPath = { ...map }
        },

        preserveScrollForPath(path, y) {
            const key = scrollKeyFromPath(path)
            const val = Math.max(0, Number(y || 0))
            if (!key) return

            const map = pruneScrollMap(readScrollMap())
            map[key] = val
            writeScrollMap(map)
            this.scrollByPath = { ...map }
            this.lastScrollY = val
            this.safeSetItem(STORAGE_KEYS.lastScrollY, String(val))
        },

        markScrollResetOnNextRoute() {
            this.resetScrollOnNextRoute = true
        },

        consumeScrollResetForPath(path) {
            if (!this.resetScrollOnNextRoute) return false
            this.resetScrollOnNextRoute = false
            this.isRestoringScroll = false
            this.saveScroll(0, path)
            return true
        },

        setRestoringScroll(restore) {
            this.isRestoringScroll = !!restore
        },

        saveSelectedSubNav(subNavName) {
            this.selectedSubNav = subNavName
            this.safeSetItem(STORAGE_KEYS.selectedSubNav, subNavName || '')
        },

        clearSelectedSubNav() {
            this.selectedSubNav = ''
            localStorage.removeItem(STORAGE_KEYS.selectedSubNav)
        },

        // 统一处理隐私模式之类的代码
        safeSetItem(key, value) {
            try {
                localStorage.setItem(key, value)
            } catch {
                // 隐私模式/存储已满：放弃本次持久化，内存状态仍正常工作
            }
        }
    }
})
