import { defineStore } from 'pinia'

const STORAGE_KEYS = {
    firstVisit: 'tto_first_visit_done',
    lastPath: 'tto_last_path',
    lastScrollY: 'tto_last_scroll_y'
}

export const useNavStore = defineStore('nav', {
    state: () => ({
        lastPath: localStorage.getItem(STORAGE_KEYS.lastPath) || '',
        lastScrollY: Number(localStorage.getItem(STORAGE_KEYS.lastScrollY) || 0)
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
        }
    }
})


