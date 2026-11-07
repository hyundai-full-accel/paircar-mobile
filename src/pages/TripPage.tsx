import { useParams } from 'react-router'
import { Card } from '../components/Card'
import { Page } from '../components/Page'

// 진행 중인 운행. 차 위치, 도착 예정, 탑승 상태를 실시간(SSE)으로 보여 줌
export function TripPage() {
  const { tripId } = useParams()

  return (
    <Page title="운행" back>
      <Card>
        <p className="text-sub">운행 {tripId}</p>
      </Card>
    </Page>
  )
}
