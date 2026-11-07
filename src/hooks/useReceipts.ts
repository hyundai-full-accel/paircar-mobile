import { useQuery } from '@tanstack/react-query'
import { api, unwrap } from '../api/client'

// 크루에서 내가 내거나 받는 그 달 영수증 (매달 1일에 지난달 것이 발행됨)
export function useMyReceipts(crewId: number, month: string) {
  return useQuery({
    queryKey: ['receipts', 'crew', crewId, month],
    queryFn: () => unwrap(api.GET('/api/crews/{crewId}/receipts', { params: { path: { crewId }, query: { month } } })),
  })
}

export function useReceipt(receiptId: number) {
  return useQuery({
    queryKey: ['receipts', receiptId],
    queryFn: () => unwrap(api.GET('/api/receipts/{receiptId}', { params: { path: { receiptId } } })),
  })
}
