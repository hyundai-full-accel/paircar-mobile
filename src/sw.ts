/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'

declare const self: ServiceWorkerGlobalScope

// 새 버전이 오면 바로 교체 (registerType: autoUpdate)
self.skipWaiting()
clientsClaim()

// 빌드 결과(js, css, 아이콘)를 미리 받아 둠. 앱 화면은 오프라인에서도 열림
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// 어떤 주소로 들어와도 index.html을 줌 (SPA). 서버 API는 제외
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html'), { denylist: [/^\/api\//] }))

// 서버(WebPushSender)가 보내는 내용
type PushPayload = {
  type: string
  title: string
  body: string
  url: string // 앱 안의 경로 (예: /trips/12)
}

self.addEventListener('push', (event) => {
  if (!event.data) return
  const payload = event.data.json() as PushPayload
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-64x64.png',
      tag: payload.type, // 같은 종류는 새 알림이 이전 알림을 대신함
      data: { url: payload.url },
    }),
  )
})

// 알림을 누르면 열려 있는 앱 창으로 가고, 없으면 새로 엶
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = new URL((event.notification.data as { url?: string })?.url ?? '/', self.location.origin).href
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const client = windows.find((it) => new URL(it.url).origin === self.location.origin)
      if (client) {
        await client.focus()
        await client.navigate(url)
        return
      }
      await self.clients.openWindow(url)
    })(),
  )
})
