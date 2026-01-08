import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import { useNavStore } from '@/stores/nav'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './style.css'

const app = createApp(App)
const pinia = createPinia()
app.use(router)
app.use(pinia)
app.use(ElementPlus)

const detectReloadNavigation = () => {
    try {
        if (typeof window === 'undefined') return false
        if (typeof performance?.getEntriesByType === 'function') {
            const entries = performance.getEntriesByType('navigation')
            if (entries && entries.length > 0) {
                return entries[0].type === 'reload'
            }
        }
        if (performance && 'navigation' in performance) {
            return performance.navigation.type === 1 // TYPE_RELOAD
        }
    } catch (e) {
        // ignore
    }
    return false
}

// 全局滚动记录（节流）
if (typeof window !== 'undefined') {
    const nav = useNavStore()
    const getScrollY = () => (window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0)
    let ticking = false
    const onScroll = () => {
        if (!ticking) {
            ticking = true
            requestAnimationFrame(() => {
                nav.saveScroll(getScrollY())
                ticking = false
            })
        }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('scroll', onScroll, { passive: true })

    const persist = () => nav.saveScroll(getScrollY())
    document.addEventListener('visibilitychange', persist)
    window.addEventListener('beforeunload', persist)

    let skipNextAfterEach = detectReloadNavigation()

    // 路由变更时记录最后路径和恢复滚动位置
    router.afterEach((to) => {
        if (skipNextAfterEach) {
            skipNextAfterEach = false
            return
        }

        // 保存路径前移除#top锚点，避免影响URL
        const path = to.fullPath || to.path
        nav.savePath(path)

        // 在下一次渲染后处理滚动位置
        requestAnimationFrame(() => {
            // 检查是否有搜索关键词，如果有则滚动到顶部
            if (to.query.s) {
                // 有搜索关键词，滚动到顶部
                window.scrollTo({ top: 0, behavior: 'auto' })
            } else {
                // 否则恢复到之前保存的滚动位置
                const savedScrollY = nav.lastScrollY
                if (savedScrollY > 0) {
                    window.scrollTo({ top: savedScrollY, behavior: 'auto' })
                } else {
                    window.scrollTo({ top: 0, behavior: 'auto' })
                }
            }
        })
    })
}

app.mount('#app')
