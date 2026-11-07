import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { ApiError } from '../api/client'
import { clearToken } from './token'

// 토큰이 만료됐거나 서버에서 지워졌으면 더 쓸 수 없으므로 지움. 화면은 "초대 링크로 다시 들어와 주세요"로 바뀜
function onError(error: Error) {
  if (error instanceof ApiError && error.code === 'UNAUTHORIZED') {
    clearToken()
    queryClient.clear()
  }
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError }),
  mutationCache: new MutationCache({ onError }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // 4xx는 다시 불러도 같으므로 재시도하지 않음. 네트워크 오류, 5xx만 한 번 더
      retry: (failureCount, error) =>
        failureCount < 1 && !(error instanceof ApiError && error.status >= 400 && error.status < 500),
    },
  },
})
