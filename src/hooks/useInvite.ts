import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { api, ApiError, unwrap } from '../api/client'
import { setToken } from '../lib/token'

// 초대 미리보기 (크루 이름, 만료 시각). 토큰 없이 부름
export function useInvite(code: string) {
  return useQuery({
    queryKey: ['invites', code],
    queryFn: () => unwrap(api.GET('/api/invites/{code}', { params: { path: { code } } })),
  })
}

// 처음 온 동승자: 닉네임으로 멤버를 만들고 크루에 참여한 뒤 그 크루 홈으로 감
// 받은 토큰은 이 응답에서만 오므로 바로 저장. 저장하면 참여 화면이 바뀌므로 이동을 먼저 함
export function useJoinAsNewMember(code: string) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (nickname: string) =>
      unwrap(api.POST('/api/invites/{code}/members', { params: { path: { code } }, body: { nickname } })),
    onSuccess: (result) => {
      queryClient.clear() // 이전 사람의 캐시가 남지 않게
      navigate(`/crews/${result.crewId}`, { replace: true })
      setToken(result.token)
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
