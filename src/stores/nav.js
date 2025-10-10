import { defineStore } from 'pinia'

const STORAGE_KEYS = {
    firstVisit: 'tto_first_visit_done',
    lastPath: 'tto_last_path', // 保存完整路由路径（用于路由恢复）
    lastScrollY: 'tto_last_scroll_y', // 保存滚动位置
    selectedSubNav: 'tto_selected_subnav', // 保存选中的子导航（仍然需要用于子导航状态）
}

export const useNavStore = defineStore('nav', {
    state: () => ({
        lastPath: localStorage.getItem(STORAGE_KEYS.lastPath) || '',
        lastScrollY: Number(localStorage.getItem(STORAGE_KEYS.lastScrollY) || 0),
        selectedSubNav: localStorage.getItem(STORAGE_KEYS.selectedSubNav) || '',
    }),
    actions: {
        markFirstVisitDone() {
            localStorage.setItem(STORAGE_KEYS.firstVisit, '1')
        },
        isFirstVisit() {
            return !localStorage.getItem(STORAGE_KEYS.firstVisit)
        },

        // 保存完整路由路径（用于路由恢复）
        savePath(path) {
            this.lastPath = path
            localStorage.setItem(STORAGE_KEYS.lastPath, path || '')
        },

        saveScroll(y) {
            const val = Math.max(0, Number(y || 0))
            this.lastScrollY = val
            localStorage.setItem(STORAGE_KEYS.lastScrollY, String(val))
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