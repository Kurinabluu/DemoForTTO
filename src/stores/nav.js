import { defineStore } from 'pinia'

const STORAGE_KEYS = {
    firstVisit: 'tto_first_visit_done',
    lastPath: 'tto_last_path',
    lastScrollY: 'tto_last_scroll_y',
    selectedService: 'tto_selected_service',
    selectedSubNav: 'tto_selected_subnav',
}

export const useNavStore = defineStore('nav', {
    state: () => ({
        lastPath: localStorage.getItem(STORAGE_KEYS.lastPath) || '',
        lastScrollY: Number(localStorage.getItem(STORAGE_KEYS.lastScrollY) || 0),
        selectedService: localStorage.getItem(STORAGE_KEYS.selectedService) || '',
        selectedSubNav: localStorage.getItem(STORAGE_KEYS.selectedSubNav) || '',
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
        saveSelectedService(serviceName) {
            this.selectedService = serviceName
            localStorage.setItem(STORAGE_KEYS.selectedService, serviceName || '')
        },
        saveSelectedSubNav(subNavName) {
            this.selectedSubNav = subNavName
            localStorage.setItem(STORAGE_KEYS.selectedSubNav, subNavName || '')
        },
        setHeaderActiveNav(navName) {
            this.headerActiveNav = navName
            localStorage.setItem(STORAGE_KEYS.headerActiveNav, navName || '网站首页')
        },
        clearSelectedService() {
            this.selectedService = ''
            localStorage.removeItem(STORAGE_KEYS.selectedService)
        },
        clearSelectedSubNav() {
            this.selectedSubNav = ''
            localStorage.removeItem(STORAGE_KEYS.selectedSubNav)
        }
    }
})


