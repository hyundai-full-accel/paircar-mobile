import { useSyncExternalStore } from 'react'
import { getToken, subscribeToken } from '../lib/token'

// 토큰이 생기거나 지워지면 다시 그림 (참여 완료, 토큰 만료)
export function useToken(): string | null {
  return useSyncExternalStore(subscribeToken, getToken)
}
