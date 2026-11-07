import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { LiveEvent } from '../api/live'
import { ToastStack, type ToastItem } from '../components/Toast'
import { LiveConnection, type LiveStatus } from '../lib/liveConnection'
import { noticeOf } from '../lib/liveMessages'
import { LiveContext } from './liveContext'

const TOAST_MS = 5_000

// 토큰이 있는 동안 서버 실시간 이벤트(SSE)를 받아서
// 1) 화면 데이터(React Query 캐시)를 바꾸고 2) 알림을 잠깐 띄우고 3) 구독한 화면에 넘김
// 앱이 백그라운드로 가면 끊고(폰 배터리, iOS가 어차피 끊음), 돌아오면 다시 붙어 놓친 변화를 맞춤
export function LiveProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<LiveStatus>('idle')
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const listeners = useRef(new Set<(event: LiveEvent) => void>())
  const toastId = useRef(0)

  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((it) => it.id !== id)), [])

  useEffect(() => {
    const connection = new LiveConnection({
      onStatus: setStatus,
      onConnected: (resumed) => {
        // 끊긴 사이 놓친 변화 (출발, 탑승, 영수증)
        if (resumed) void queryClient.invalidateQueries()
      },
      onEvent: (event) => {
        applyToCache(queryClient, event)
        const notice = noticeOf(event)
        if (notice) {
          const id = ++toastId.current
          setToasts((list) => [...list.slice(-2), { ...notice, id }])
          setTimeout(() => dismiss(id), TOAST_MS)
        }
        listeners.current.forEach((listener) => listener(event))
      },
    })

    const sync = () => (document.visibilityState === 'visible' ? connection.start() : connection.stop())
    sync()
    document.addEventListener('visibilitychange', sync)
    return () => {
      document.removeEventListener('visibilitychange', sync)
      connection.stop()
    }
  }, [queryClient, dismiss])

  const subscribe = useCallback((listener: (event: LiveEvent) => void) => {
    listeners.current.add(listener)
    return () => {
      listeners.current.delete(listener)
    }
  }, [])

  const value = useMemo(() => ({ status, subscribe }), [status, subscribe])

  return (
    <LiveContext.Provider value={value}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </LiveContext.Provider>
  )
}

// 이벤트에 맞춰 캐시를 바꿈. 위치처럼 자주 오는 값은 직접 넣고, 나머지는 다시 불러오게 함
function applyToCache(queryClient: QueryClient, event: LiveEvent) {
  switch (event.type) {
    case 'vehicle.location':
      queryClient.setQueryData(['trips', event.tripId, 'vehicle'], { ...event.data, occurredAt: event.occurredAt })
      break
    case 'vehicle.approaching':
    case 'vehicle.arrived':
    case 'driver.delayed':
      queryClient.setQueryData(['trips', event.tripId, 'notice'], event)
      break
    case 'trip.started':
    case 'rider.boarded':
    case 'trip.ended':
      void queryClient.invalidateQueries({ queryKey: ['trips', event.tripId] })
      void queryClient.invalidateQueries({ queryKey: ['crews'] }) // 진행 중 운행 배너
      break
    case 'rider.attendance-changed':
      void queryClient.invalidateQueries({ queryKey: ['crews', event.data.crewId, 'attendance', event.data.serviceDate] })
      break
    case 'detour.confirm-requested':
      void queryClient.invalidateQueries({ queryKey: ['crews', event.data.crewId, 'detours'] })
      break
    case 'receipt.issued':
    case 'receipt.inquiry-created':
      void queryClient.invalidateQueries({ queryKey: ['receipts'] })
      break
  }
}
