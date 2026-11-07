import { useQuery } from '@tanstack/react-query'
import { api, unwrap } from '../api/client'
import { useMe } from './useMe'

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

// 이 크루에서의 나 (크루 멤버). 크루원 목록과 내 멤버 정보를 맞춰 찾음
export function useMyCrewMember(crewId: number) {
  const me = useMe()
  const members = useCrewMembers(crewId)
  return {
    data: me.data && members.data?.find((it) => it.memberId === me.data.memberId),
    isPending: me.isPending || members.isPending,
    error: me.error ?? members.error,
  }
}

// 진행 중인 운행. 없으면 null (서버는 data 없이 성공)
export function useCurrentTrip(crewId: number) {
  return useQuery({
    queryKey: ['crews', crewId, 'trips', 'current'],
    queryFn: async () =>
      (await unwrap(api.GET('/api/crews/{crewId}/trips/current', { params: { path: { crewId } } }))) ?? null,
  })
}

// 크루 화면들이 같이 쓰는 묶음: 크루, 크루원, 이 크루에서의 나
export function useCrewView(crewId: number) {
  const crew = useCrew(crewId)
  const members = useCrewMembers(crewId)
  const me = useMe()
  return {
    crew: crew.data,
    members: members.data,
    myMember: me.data && members.data?.find((it) => it.memberId === me.data.memberId),
    isPending: crew.isPending || members.isPending || me.isPending,
    error: crew.error ?? members.error ?? me.error,
    refetch: () => Promise.all([crew.refetch(), members.refetch(), me.refetch()]),
  }
}
