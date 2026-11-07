import { registerSW } from 'virtual:pwa-register'

// 서비스 워커(src/sw.ts) 등록. 홈 화면 추가와 폰 알림에 필요함
export function registerServiceWorker() {
  registerSW({ immediate: true })
}
