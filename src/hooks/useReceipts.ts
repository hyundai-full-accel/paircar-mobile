import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

// 영수증 기록 확인 요청 ("이 기록에 문제가 있나요?"). 영수증은 바뀌지 않고 운전자가 보고 처리함
export function useReceiptInquiries(receiptId: number) {
  return useQuery({
    queryKey: ['receipts', receiptId, 'inquiries'],
    queryFn: () => unwrap(api.GET('/api/receipts/{receiptId}/inquiries', { params: { path: { receiptId } } })),
  })
}

export function useCreateInquiry(receiptId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (message: string) =>
      unwrap(api.POST('/api/receipts/{receiptId}/inquiries', { params: { path: { receiptId } }, body: { message } })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['receipts', receiptId, 'inquiries'] }),
  })
}
