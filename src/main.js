import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import { useNavStore } from '@/stores/nav'

const app = createApp(App)
const pinia = createPinia()
app.use(router)
app.use(pinia)

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

    // 路由变更时记录最后路径和恢复滚动位置
    router.afterEach((to) => {
        const path = to.fullPath || to.path
        nav.savePath(path)
        
        // 在下一次渲染后恢复滚动位置
        requestAnimationFrame(() => {
            const savedScrollY = nav.lastScrollY
            if (savedScrollY > 0) {
                window.scrollTo({ top: savedScrollY, behavior: 'auto' })
            } else {
                window.scrollTo({ top: 0, behavior: 'auto' })
            }
        })
    })
}

app.mount('#app')
