// 서버가 멤버를 만들 때 한 번만 주는 기기 토큰. 잃어버리면 다시 받을 수 없음
// 사생활 보호 모드처럼 저장소를 못 쓰는 브라우저에서도 앱이 죽지 않게 예외를 삼킴
const KEY = 'paircar.token'

export function getToken(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function setToken(token: string) {
  try {
    localStorage.setItem(KEY, token)
  } catch {
    // 저장 못 하면 이번 방문 동안만 로그인 상태
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // 지울 것이 없음
  }
}
