import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

const base = process.env.BASE_PATH || '/'

export default defineConfig({
  base,
  plugins: [
    vue(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'icons/*.png', 'data-notices.txt'],
      manifest: {
        id: base,
        name: '蝦米練習室｜嘸蝦米練習與查碼',
        short_name: '蝦米練習室',
        description: '從字根到文章，每天一點，把嘸蝦米練成手感。',
        lang: 'zh-Hant',
        start_url: base,
        scope: base,
        display: 'standalone',
        background_color: '#f5f7fc',
        theme_color: '#f5f7fc',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2,json}'],
        navigateFallback: `${base}index.html`,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },
    }),
  ],
  test: { include: ['src/**/*.test.ts'] },
})
