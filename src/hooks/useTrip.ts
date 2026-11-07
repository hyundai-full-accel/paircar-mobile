import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, unwrap } from '../api/client'
import type { LiveEvent, LiveEventMap } from '../api/live'

export function useTrip(tripId: number) {
  return useQuery({
    queryKey: ['trips', tripId],
    queryFn: () => unwrap(api.GET('/api/trips/{tripId}', { params: { path: { tripId } } })),
  })
}

export type VehicleState = LiveEventMap['vehicle.location'] & { occurredAt: string }

// 실시간으로만 오는 값 (서버에 조회 API 없음). LiveProvider가 캐시에 넣은 것을 읽기만 함
function useLiveValue<T>(key: unknown[]) {
  return useQuery<T | null>({ queryKey: key, queryFn: () => null, enabled: false, staleTime: Infinity }).data ?? null
}

// 차 위치, 내 지점까지 남은 시간·거리 (운전자 차량 앱이 10초마다 보냄)
export function useVehicle(tripId: number | undefined) {
  return useLiveValue<VehicleState>(['trips', tripId, 'vehicle'])
}

// 마지막 운행 알림 (곧 도착, 도착, 운전자 지각)
export function useTripNotice(tripId: number | undefined) {
  return useLiveValue<LiveEvent>(['trips', tripId, 'notice'])
}

// 운행 중 동승자가 보내는 변경: 지각, 오늘 불참, 이번 운행만 탈 곳 변경
// 보내면 운전자 차량 앱에 바로 알림이 가고 음성으로 읽어 줌
export function useTripRequest(tripId: number, crewMemberId: number) {
  const queryClient = useQueryClient()
  const path = { tripId, crewMemberId }
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['trips', tripId] })
    void queryClient.invalidateQueries({ queryKey: ['crews'] })
  }
  return {
    delay: useMutation({
      mutationFn: (minutes: number) =>
        unwrap(api.POST('/api/trips/{tripId}/live/me/delay', { params: { path: { tripId } }, body: { minutes } })),
    }),
    cancel: useMutation({
      mutationFn: () => unwrap(api.DELETE('/api/trips/{tripId}/boardings/{crewMemberId}', { params: { path } })),
      onSuccess: refresh,
    }),
    changePlace: useMutation({
      mutationFn: (placeId: number) =>
        unwrap(api.PUT('/api/trips/{tripId}/boardings/{crewMemberId}/board-place', { params: { path }, body: { placeId } })),
      onSuccess: refresh,
    }),
  }
}
