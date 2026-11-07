import { api, unwrap } from '../api/client'

export type PushResult = 'subscribed' | 'unsupported' | 'denied' | 'disabled'

// iOS는 홈 화면에 추가한 앱에서만 PushManager가 있음
export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

/**
 * 폰 알림 켜기. 알림 권한을 묻고, 브라우저 구독을 만들어 서버에 등록함
 * 권한 요청은 버튼 클릭 같은 사용자 동작 안에서 불러야 함 (iOS, Safari 제약)
 */
export async function enablePush(): Promise<PushResult> {
  if (!isPushSupported()) return 'unsupported'

  const config = await unwrap(api.GET('/api/push/config'))
  if (!config.enabled || !config.publicKey) return 'disabled'

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return 'denied'

  const registration = await navigator.serviceWorker.ready
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToBytes(config.publicKey),
    }))

  const { endpoint, keys } = subscription.toJSON()
  if (!endpoint || !keys?.p256dh || !keys.auth) return 'unsupported'
  await unwrap(api.PUT('/api/push/subscriptions', { body: { endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } } }))
  return 'subscribed'
}

// 폰 알림 끄기. 서버 구독을 지우고 브라우저 구독도 해제함
export async function disablePush() {
  if (!isPushSupported()) return
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) return
  await unwrap(api.DELETE('/api/push/subscriptions', { body: { endpoint: subscription.endpoint } }))
  await subscription.unsubscribe()
}

// VAPID 공개 키(base64url)를 subscribe가 받는 바이트로 바꿈
function base64UrlToBytes(base64Url: string) {
  const base64 = (base64Url + '='.repeat((4 - (base64Url.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const bytes = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return bytes
}
