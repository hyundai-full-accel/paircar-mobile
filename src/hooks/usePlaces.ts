import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, unwrap } from '../api/client'

// 크루 장소 (정문, 회사, 운전자 집). 크루 멤버 누구나 등록하고 같이 씀
export function useCrewPlaces(crewId: number) {
  return useQuery({
    queryKey: ['crews', crewId, 'places'],
    queryFn: () => unwrap(api.GET('/api/crews/{crewId}/places', { params: { path: { crewId } } })),
  })
}

export type NewPlace = { name: string; latitude: number; longitude: number }

export function useRegisterPlace(crewId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (place: NewPlace) =>
      unwrap(api.POST('/api/crews/{crewId}/places', { params: { path: { crewId } }, body: place })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crews', crewId, 'places'] }),
  })
}

// 평소 탈 곳, 내릴 곳, 픽업 시각(HH:mm) 전체 값. 안 보낸 값은 지워짐
export type MemberPlaces = { boardPlaceId: number | null; alightPlaceId: number | null; pickupTime: string | null }

// 크루 멤버의 평소 탈 곳, 내릴 곳. 크루원 목록, 출석에 바로 반영되도록 다시 불러옴
export function useChangeMemberPlaces(crewId: number, crewMemberId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (places: MemberPlaces) =>
      unwrap(
        api.PUT('/api/crews/{crewId}/members/{crewMemberId}/places', {
          params: { path: { crewId, crewMemberId } },
          body: places,
        }),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crews', crewId] }),
  })
}
