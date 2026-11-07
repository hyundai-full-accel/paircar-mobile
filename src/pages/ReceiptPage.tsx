import { useParams } from 'react-router'

// 월 영수증. 보낼 금액, 운행별 내역, 받는 사람 계좌
export function ReceiptPage() {
  const { receiptId } = useParams()

  return (
    <main className="p-6">
      <h1 className="text-xl font-bold text-gray-900">영수증</h1>
      <p className="mt-2 text-gray-500">영수증 {receiptId}</p>
    </main>
  )
}
