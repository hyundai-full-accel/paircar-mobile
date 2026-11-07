import { useQuery } from '@tanstack/react-query'
import { api, unwrap } from '../api/client'

export function useMyCrews() {
  return useQuery({
    queryKey: ['crews', 'me'],
    queryFn: () => unwrap(api.GET('/api/crews/me')),
  })
}

export function useCrew(crewId: number) {
  return useQuery({
    queryKey: ['crews', crewId],
    queryFn: () => unwrap(api.GET('/api/crews/{crewId}', { params: { path: { crewId } } })),
  })
}

export function useCrewMembers(crewId: number) {
  return useQuery({
    queryKey: ['crews', crewId, 'members'],
    queryFn: () => unwrap(api.GET('/api/crews/{crewId}/members', { params: { path: { crewId } } })),
  })
}

// 진행 중인 운행. 없으면 null (서버는 data 없이 성공)
export function useCurrentTrip(crewId: number) {
  return useQuery({
    queryKey: ['crews', crewId, 'trips', 'current'],
    queryFn: async () =>
      (await unwrap(api.GET('/api/crews/{crewId}/trips/current', { params: { path: { crewId } } }))) ?? null,
  })
}
