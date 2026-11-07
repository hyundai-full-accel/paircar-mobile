import { Navigate, useParams } from 'react-router'
import { Page } from '../components/Page'
import { ErrorView, LoadingView } from '../components/StatusView'
import { useReceipt } from '../hooks/useReceipts'
import { NotFoundPage } from './NotFoundPage'

// 폰 알림("11월 영수증이 도착했어요")을 누르면 서버가 정한 /receipts/:receiptId로 열림
// 영수증 화면은 크루의 월별 정산이라 그 크루, 그 달로 보냄
export function ReceiptPage() {
  const receiptId = Number(useParams().receiptId)
  if (!Number.isInteger(receiptId)) return <NotFoundPage />
  return <ReceiptRedirect receiptId={receiptId} />
}

function ReceiptRedirect({ receiptId }: { receiptId: number }) {
  const { data: receipt, error, refetch } = useReceipt(receiptId)
  if (receipt) return <Navigate to={`/crews/${receipt.crewId}/settlement?month=${receipt.month}`} replace />
  return <Page title="월별 정산">{error ? <ErrorView error={error} onRetry={() => refetch()} /> : <LoadingView />}</Page>
}
