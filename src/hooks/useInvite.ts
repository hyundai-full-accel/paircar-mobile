import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { api, ApiError, unwrap } from '../api/client'
import { setToken } from '../lib/token'

// 초대 미리보기 (크루 이름, 일정, 인원, 운전자, 정산 방식, 크루 장소). 토큰 없이 부름
export function useInvite(code: string) {
  return useQuery({
    queryKey: ['invites', code],
    queryFn: () => unwrap(api.GET('/api/invites/{code}', { params: { path: { code } } })),
  })
}

export type JoinForm = {
  nickname: string
  boardPlaceId: number | null
  alightPlaceId: number | null
}

// 처음 온 동승자 참여 (참여 3단계의 마지막): 멤버를 만들어 크루에 넣고 → 토큰 저장 → 평소 탈 곳 저장 → 크루 홈
// 토큰은 이 응답에서만 오므로 바로 저장. 탈 곳 저장이 실패해도 참여는 된 것이라 크루 홈으로 감 (나중에 다시 정함)
export function useJoinCrew(code: string) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: async ({ nickname, boardPlaceId, alightPlaceId }: JoinForm) => {
      const joined = await unwrap(
        api.POST('/api/invites/{code}/members', { params: { path: { code } }, body: { nickname } }),
      )
      setToken(joined.token)
      if (boardPlaceId !== null || alightPlaceId !== null) {
        await unwrap(
          api.PUT('/api/crews/{crewId}/members/{crewMemberId}/places', {
            params: { path: { crewId: joined.crewId, crewMemberId: joined.crewMemberId } },
            body: { boardPlaceId, alightPlaceId },
          }),
        ).catch(() => undefined)
      }
      return joined
    },
    onSuccess: (joined) => {
      queryClient.clear() // 이전 사람의 캐시가 남지 않게
      navigate(`/crews/${joined.crewId}`, { replace: true })
    },
  })
}

// 이미 토큰이 있는 멤버: 이 크루에도 참여하고 그 크루 홈으로 감. 이미 참여했으면 성공으로 봄 (링크를 다시 누른 경우)
export function useJoinAsMember(code: string, crewId: number) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: async () => {
      try {
        await unwrap(api.POST('/api/invites/{code}/join', { params: { path: { code } } }))
      } catch (e) {
        if (e instanceof ApiError && e.code === 'CREW_MEMBER_ALREADY_EXISTS') return
        throw e
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crews'] })
      navigate(`/crews/${crewId}`, { replace: true })
    },
  })
}
