import { defineStore } from 'pinia'

const STORAGE_KEYS = {
    firstVisit: 'tto_first_visit_done',
    lastPath: 'tto_last_path', // 保存完整路由路径（用于路由恢复）
    lastScrollY: 'tto_last_scroll_y', // 保存滚动位置
    selectedSubNav: 'tto_selected_subnav', // 保存选中的子导航
    selectedRoute: 'tto_selected_route', // 保存路由类型(Trips/Service)
    selectedTagName: 'tto_selected_tagname', // 保存选中的标签名
}

export const useNavStore = defineStore('nav', {
    state: () => ({
        lastPath: localStorage.getItem(STORAGE_KEYS.lastPath) || '', // 保存完整路由路径（用于路由恢复）
        lastScrollY: Number(localStorage.getItem(STORAGE_KEYS.lastScrollY) || 0),
        selectedSubNav: localStorage.getItem(STORAGE_KEYS.selectedSubNav) || '',
        selectedRoute: localStorage.getItem(STORAGE_KEYS.selectedRoute) || '', // 保存路由类型(Trips/Service)
        selectedTagName: localStorage.getItem(STORAGE_KEYS.selectedTagName) || '', // 保存选中的标签名
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
        
        // 保存选中的标签名
        saveSelectedTagName(tagName) {
            this.selectedTagName = tagName
            localStorage.setItem(STORAGE_KEYS.selectedTagName, tagName || '')
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
        // 保存路由类型和路径信息
        saveSelectedRoute(routeType) {
            this.selectedRoute = routeType
            localStorage.setItem(STORAGE_KEYS.selectedRoute, routeType || '')
        },
        // 清除保存的路由类型
        clearSelectedRoute() {
            this.selectedRoute = ''
            localStorage.removeItem(STORAGE_KEYS.selectedRoute)
        }
    }
})


