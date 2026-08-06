import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import { useNavStore } from '@/stores/nav'
import './style.css'

const app = createApp(App)
const pinia = createPinia()
app.use(router)
app.use(pinia)

// 全局滚动记录（节流）
if (typeof window !== 'undefined') {
    const nav = useNavStore()
    const getScrollY = () => (window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0)

    const getRoutePath = () => {
        const route = router.currentRoute.value
        return route?.fullPath || route?.path || ''
    }

    let ticking = false
    const onScroll = () => {
        if (!ticking) {
            ticking = true
            requestAnimationFrame(() => {
                nav.saveScroll(getScrollY(), getRoutePath())
                ticking = false
            })
        }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('scroll', onScroll, { passive: true })

    const persist = () => nav.saveScroll(getScrollY(), getRoutePath())
    document.addEventListener('visibilitychange', persist)
    window.addEventListener('beforeunload', persist)

    let restoreFrameId = 0
    const cancelScrollRestore = () => {
        if (restoreFrameId) {
            cancelAnimationFrame(restoreFrameId)
            restoreFrameId = 0
        }
        nav.setRestoringScroll(false)
    }

    const restoreScrollPosition = (targetY, pathKey) => {
        cancelScrollRestore()

        const target = Math.max(0, Number(targetY) || 0)
        const path = pathKey || getRoutePath()

        if (target <= 0) {
            window.scrollTo({ top: 0, behavior: 'auto' })
            return
        }

        nav.setRestoringScroll(true)
        let attempts = 0
        let lastMaxScroll = -1
        const maxAttempts = 600

        const finishRestore = (reachedTarget) => {
            if (!reachedTarget) {
                nav.preserveScrollForPath(path, target)
            }
            cancelScrollRestore()
        }

        const tryRestore = () => {
            const maxScroll = Math.max(
                0,
                document.documentElement.scrollHeight - window.innerHeight
            )
            const currentY = getScrollY()
            const reachedTarget = Math.abs(currentY - target) <= 2

            if (reachedTarget) {
                finishRestore(true)
                return
            }

            // 仅在页面高度增加或首次尝试时滚动，避免反复 scrollTo 干扰懒加载
            if (attempts === 0 || maxScroll > lastMaxScroll + 1) {
                window.scrollTo({ top: Math.min(target, maxScroll), behavior: 'auto' })
                lastMaxScroll = maxScroll
            }

            if (attempts >= maxAttempts) {
                finishRestore(false)
                return
            }

            attempts += 1
            restoreFrameId = requestAnimationFrame(tryRestore)
        }

        restoreFrameId = requestAnimationFrame(tryRestore)
    }

    const restoreScrollForRoute = (routeLike) => {
        const path = routeLike?.fullPath || routeLike?.path || ''
        if (routeLike?.query?.s) {
            cancelScrollRestore()
            window.scrollTo({ top: 0, behavior: 'auto' })
            return
        }
        if (nav.consumeScrollResetForPath(path)) {
            cancelScrollRestore()
            window.scrollTo({ top: 0, behavior: 'auto' })
            return
        }
        restoreScrollPosition(nav.getScrollForPath(path), path)
    }

    window.addEventListener('tto:content-ready', () => {
        restoreScrollForRoute(router.currentRoute.value)
    })

    // 路由变更时记录最后路径和恢复滚动位置
    router.afterEach((to) => {
        const path = to.fullPath || to.path
        nav.savePath(path)

        requestAnimationFrame(() => {
            restoreScrollForRoute(to)
        })
    })
}

app.mount('#app')
