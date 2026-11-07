import { useParams } from 'react-router'
import { Card } from '../components/Card'
import { Page } from '../components/Page'

// 월 영수증. 보낼 금액, 운행별 내역, 받는 사람 계좌
export function ReceiptPage() {
  const { receiptId } = useParams()

  return (
    <Page title="영수증" back>
      <Card>
        <p className="text-gray-500">영수증 {receiptId}</p>
      </Card>
    </Page>
  )
}
