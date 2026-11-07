import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// public/favicon.svg 하나로 홈 화면 아이콘, 애플 터치 아이콘을 빌드 때 만듦
export default defineConfig({
  headLinkOptions: {
    preset: '2023',
  },
  preset: minimal2023Preset,
  images: ['public/favicon.svg'],
})
