import { createContext } from 'react'
import type { LiveEvent } from '../api/live'
import type { LiveStatus } from '../lib/liveConnection'

export type LiveContextValue = {
  status: LiveStatus
  // 화면이 특정 이벤트에 반응할 때 (구독 해제 함수를 돌려줌)
  subscribe: (listener: (event: LiveEvent) => void) => () => void
}

export const LiveContext = createContext<LiveContextValue>({
  status: 'idle',
  subscribe: () => () => {},
})
