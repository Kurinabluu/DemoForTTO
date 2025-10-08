import { defineStore } from 'pinia'

const STORAGE_KEYS = {
    firstVisit: 'tto_first_visit_done',
    lastPath: 'tto_last_path', // 保存完整路由路径
    lastScrollY: 'tto_last_scroll_y', // 保存滚动位置
    selectedSubNav: 'tto_selected_subnav', // 保存选中的子导航
    selectedRoute: 'tto_selected_route', // 保存路由名称
}

export const useNavStore = defineStore('nav', {
    state: () => ({
        lastPath: localStorage.getItem(STORAGE_KEYS.lastPath) || '',
        lastScrollY: Number(localStorage.getItem(STORAGE_KEYS.lastScrollY) || 0),
        selectedSubNav: localStorage.getItem(STORAGE_KEYS.selectedSubNav) || '',
        selectedRoute: localStorage.getItem(STORAGE_KEYS.selectedRoute) || '', // 保存路由名称
    }),
    actions: {
        markFirstVisitDone() {
            localStorage.setItem(STORAGE_KEYS.firstVisit, '1')
        },
        isFirstVisit() {
            return !localStorage.getItem(STORAGE_KEYS.firstVisit)
        },
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
        setHeaderActiveNav(navName) {
            this.headerActiveNav = navName
            localStorage.setItem(STORAGE_KEYS.headerActiveNav, navName || '网站首页')
        },
        clearSelectedSubNav() {
            this.selectedSubNav = ''
            localStorage.removeItem(STORAGE_KEYS.selectedSubNav)
        },
        // 保存路由名称
        saveSelectedRoute(routeName) {
            this.selectedRoute = routeName
            localStorage.setItem(STORAGE_KEYS.selectedRoute, routeName || '')
        },
        // 清除保存的路由名称
        clearSelectedRoute() {
            this.selectedRoute = ''
            localStorage.removeItem(STORAGE_KEYS.selectedRoute)
        }
    }
})


