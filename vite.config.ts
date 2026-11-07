import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // 폰 알림(Web Push)을 받으려면 서비스 워커를 직접 써야 해서 injectManifest
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectRegister: false, // src/lib/serviceWorker.ts에서 등록
      pwaAssets: {
        config: true, // pwa-assets.config.ts
      },
      manifest: {
        name: '페어카',
        short_name: '페어카',
        description: '카풀 운행 확인과 월 정산',
        lang: 'ko',
        start_url: '/',
        display: 'standalone',
        theme_color: '#2563eb',
        background_color: '#ffffff',
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
      // 개발 서버(localhost)에서도 서비스 워커를 띄워 Push를 시험할 수 있게 함
      // 개발 때 precache 목록이 비면 sw.ts의 index.html 폴백이 실패하므로 index.html을 넣어 줌
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: 'index.html',
      },
    }),
  ],
  server: {
    // 서버 초대 링크 기본값(PAIRCAR_INVITE_BASE_URL=http://localhost:3000/join)과 맞춤
    port: 3000,
    // 로컬 서버(nginx, infra/compose.yaml)로 넘겨서 CORS 없이 호출
    proxy: {
      '/api': {
        target: 'http://localhost',
        // 서버가 SSE 연결을 끊어도(재시작 등) 프록시가 브라우저 쪽 연결을 열어 둬서
        // 앱이 끊긴 줄 모르고 다시 붙지 않음. 서버 쪽이 닫히면 브라우저 쪽도 닫음 (배포 nginx는 원래 이렇게 동작)
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes, _req, res) => {
            proxyRes.on('close', () => {
              if (!res.writableEnded) res.destroy()
            })
          })
        },
      },
    },
  },
})
