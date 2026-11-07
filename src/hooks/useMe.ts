import { useQuery } from '@tanstack/react-query'
import { api, unwrap } from '../api/client'
import { getToken } from '../lib/token'

// 토큰이 없으면 아직 크루에 참여하지 않은 사람이라 부르지 않음
export function useMe() {
  return useQuery({
    queryKey: ['members', 'me'],
    queryFn: () => unwrap(api.GET('/api/members/me')),
    enabled: getToken() !== null,
  })
}
