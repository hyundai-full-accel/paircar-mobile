// 서버가 멤버를 만들 때 한 번만 주는 기기 토큰. 잃어버리면 다시 받을 수 없음
// 사생활 보호 모드처럼 저장소를 못 쓰는 브라우저에서도 앱이 죽지 않게 예외를 삼킴
const KEY = 'paircar.token'

// 저장소를 못 쓸 때도 이번 방문 동안은 로그인 상태를 유지
let memoryToken: string | null = null
const listeners = new Set<() => void>()

export function getToken(): string | null {
  try {
    return localStorage.getItem(KEY) ?? memoryToken
  } catch {
    return memoryToken
  }
}

export function setToken(token: string) {
  memoryToken = token
  try {
    localStorage.setItem(KEY, token)
  } catch {
    // 메모리에만 둠
  }
  notify()
}

export function clearToken() {
  memoryToken = null
  try {
    localStorage.removeItem(KEY)
  } catch {
    // 지울 것이 없음
  }
  notify()
}

// 토큰이 바뀌면 알림 (같은 탭의 setToken, clearToken과 다른 탭의 변경)
export function subscribeToken(listener: () => void): () => void {
  listeners.add(listener)
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) listener()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

function notify() {
  listeners.forEach((listener) => listener())
}
