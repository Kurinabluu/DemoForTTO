import { defineStore } from 'pinia'

const STORAGE_KEYS = {
    firstVisit: 'tto_first_visit_done',
    lastPath: 'tto_last_path', // 保存完整路由路径（用于路由恢复）
    lastScrollY: 'tto_last_scroll_y', // 兼容旧版：最近一次滚动位置
    scrollByPath: 'tto_scroll_by_path', // 按路由保存滚动位置
    selectedSubNav: 'tto_selected_subnav', // 保存选中的子导航（仍然需要用于子导航状态）
}

const MAX_SCROLL_PATH_ENTRIES = 30

function normalizeRoutePath(path) {
    return (path || '').split('#')[0]
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
    localStorage.setItem(STORAGE_KEYS.scrollByPath, JSON.stringify(map))
}

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
            localStorage.setItem(STORAGE_KEYS.firstVisit, '1')
        },
        isFirstVisit() {
            return !localStorage.getItem(STORAGE_KEYS.firstVisit)
        },

        // 保存完整路由路径（用于路由恢复，移除#top锚点）
        savePath(path) {
            const pathWithoutAnchor = normalizeRoutePath(path)
            this.lastPath = pathWithoutAnchor
            localStorage.setItem(STORAGE_KEYS.lastPath, pathWithoutAnchor)
        },

        getScrollForPath(path) {
            const key = normalizeRoutePath(path)
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

        saveScroll(y, path) {
            if (this.isRestoringScroll) return

            const val = Math.max(0, Number(y || 0))
            const key = normalizeRoutePath(path || this.lastPath)
            this.lastScrollY = val
            localStorage.setItem(STORAGE_KEYS.lastScrollY, String(val))

            if (!key) return

            const map = pruneScrollMap(readScrollMap())
            map[key] = val
            writeScrollMap(map)
            this.scrollByPath = { ...map }
        },

        preserveScrollForPath(path, y) {
            const key = normalizeRoutePath(path)
            const val = Math.max(0, Number(y || 0))
            if (!key) return

            const map = pruneScrollMap(readScrollMap())
            map[key] = val
            writeScrollMap(map)
            this.scrollByPath = { ...map }
            this.lastScrollY = val
            localStorage.setItem(STORAGE_KEYS.lastScrollY, String(val))
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
            localStorage.setItem(STORAGE_KEYS.selectedSubNav, subNavName || '')
        },

        clearSelectedSubNav() {
            this.selectedSubNav = ''
            localStorage.removeItem(STORAGE_KEYS.selectedSubNav)
        }
    }
})
