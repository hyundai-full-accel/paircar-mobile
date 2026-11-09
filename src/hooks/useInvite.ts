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

// 참여 전에 지도에서 새로 정한 장소. 아직 토큰이 없어 서버에 못 넣으므로 음수 임시 ID로 들고 있다가 참여 직후 등록함
export type DraftPlace = { placeId: number; name: string; latitude: number; longitude: number }

export type JoinForm = {
  nickname: string
  boardPlaceId: number | null // 음수면 newPlaces의 임시 장소
  alightPlaceId: number | null
  newPlaces: DraftPlace[]
}

// 임시 장소를 크루 장소로 등록하고 진짜 ID를 돌려줌. 그사이 누가 같은 이름으로 넣었으면 그 장소를 씀
async function registerDraft(crewId: number, draft: DraftPlace): Promise<number | null> {
  const body = { name: draft.name, latitude: draft.latitude, longitude: draft.longitude }
  try {
    return (await unwrap(api.POST('/api/crews/{crewId}/places', { params: { path: { crewId } }, body }))).placeId
  } catch (e) {
    if (!(e instanceof ApiError && e.code === 'CREW_PLACE_NAME_DUPLICATED')) return null
    const places = await unwrap(api.GET('/api/crews/{crewId}/places', { params: { path: { crewId } } })).catch(() => [])
    return places.find((it) => it.name === draft.name)?.placeId ?? null
  }
}

// 처음 온 동승자 참여 (참여 3단계의 마지막): 멤버를 만들어 크루에 넣고 → 토큰 저장 → 새로 정한 장소 등록 → 평소 탈 곳, 정산 기준 동의 저장 → 크루 홈
// 토큰은 이 응답에서만 오므로 바로 저장. 탈 곳, 동의 저장이 실패해도 참여는 된 것이라 크루 홈으로 감 (월별 정산에서 다시 동의)
export function useJoinCrew(code: string) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: async ({ nickname, boardPlaceId: boardId, alightPlaceId: alightId, newPlaces }: JoinForm) => {
      const joined = await unwrap(
        api.POST('/api/invites/{code}/members', { params: { path: { code } }, body: { nickname } }),
      )
      setToken(joined.token)
      const resolve = async (id: number | null) => {
        if (id === null || id >= 0) return id
        const draft = newPlaces.find((it) => it.placeId === id)
        return draft ? registerDraft(joined.crewId, draft) : null
      }
      const boardPlaceId = await resolve(boardId)
      const alightPlaceId = await resolve(alightId)
      if (boardPlaceId !== null || alightPlaceId !== null) {
        await unwrap(
          api.PUT('/api/crews/{crewId}/members/{crewMemberId}/places', {
            params: { path: { crewId: joined.crewId, crewMemberId: joined.crewMemberId } },
            body: { boardPlaceId, alightPlaceId, pickupTime: null },
          }),
        ).catch(() => undefined)
      }
      const path = { crewId: joined.crewId, crewMemberId: joined.crewMemberId }
      await unwrap(api.POST('/api/crews/{crewId}/members/{crewMemberId}/settlement-agreement', { params: { path } })).catch(() => undefined)
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

// 크루원 누구나 초대 링크를 만들 수 있음 (7일 동안 유효)
export function useCreateInvite(crewId: number) {
  return useMutation({
    mutationFn: () => unwrap(api.POST('/api/crews/{crewId}/invites', { params: { path: { crewId } } })),
  })
}
