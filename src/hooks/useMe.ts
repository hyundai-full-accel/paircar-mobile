import { useQuery } from '@tanstack/react-query'
import { api, unwrap } from '../api/client'

// 토큰이 있는 화면(RequireToken 안)에서만 씀
export function useMe() {
  return useQuery({
    queryKey: ['members', 'me'],
    queryFn: () => unwrap(api.GET('/api/members/me')),
  })
}
