import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

const SEO_HUB_PATHS = [
  '/trips/freeinfo',
  '/trips/routes',
  '/about',
  '/privacy',
  '/terms',
  '/refund',
  '/service/ticket',
  '/service/car',
  '/service/pickup',
  '/service/guide',
  '/service/steward',
  '/service/custom',
]

function joinPublicUrl(origin, base, routePath) {
  const o = String(origin || '').replace(/\/+$/, '')
  let b = String(base || '/')
  if (!b.startsWith('/')) b = `/${b}`
  if (!b.endsWith('/')) b = `${b}/`
  const p = String(routePath || '').replace(/^\//, '')
  return `${o}${b}${p}`
}

function seoBuildPlugin(env) {
  return {
    name: 'tto-seo-build',
    closeBundle() {
      const dist = path.resolve('dist')
      const indexFile = path.join(dist, 'index.html')
      if (fs.existsSync(indexFile)) {
        fs.copyFileSync(indexFile, path.join(dist, '404.html'))
      }
      const origin = String(env.VITE_SITE_ORIGIN || '').trim().replace(/\/+$/, '')
      const base = env.VITE_APP_BASE || '/DemoForTTO/'
      if (!origin) return
      const urls = SEO_HUB_PATHS.map((hub) => `  <url><loc>${joinPublicUrl(origin, base, hub)}</loc></url>`).join('\n')
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
      fs.writeFileSync(path.join(dist, 'sitemap.xml'), xml)
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const appBase = env.VITE_APP_BASE || '/DemoForTTO/'

  return {
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver({ importStyle: 'sass' })],
    }),
    Components({
      resolvers: [ElementPlusResolver({ importStyle: 'sass' })],
    }),
    seoBuildPlugin(env),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  base: appBase,
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: './',
    rollupOptions: {
      output: {
        // 确保资源路径包含仓库名
        assetFileNames: (assetInfo) => {
          if (assetInfo.fileName?.endsWith('.css')) {
            return 'assets/[name]-[hash].css';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  }
  }
})
