import { useContext, useEffect, useRef } from 'react'
import type { LiveEvent } from '../api/live'
import { LiveContext } from '../app/liveContext'

// 실시간 연결 상태 (연결 중, 연결됨, 다시 연결 중)
export function useLiveStatus() {
  return useContext(LiveContext).status
}

// 실시간 이벤트를 받을 때마다 listener를 부름. listener는 매번 새로 만들어도 됨
export function useLiveEvent(listener: (event: LiveEvent) => void) {
  const { subscribe } = useContext(LiveContext)
  const latest = useRef(listener)
  useEffect(() => {
    latest.current = listener
  })
  useEffect(() => subscribe((event) => latest.current(event)), [subscribe])
}
