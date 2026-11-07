import { useParams } from 'react-router'
import { Card } from '../components/Card'
import { Page } from '../components/Page'

// 운전자가 계산한 우회 거리를 동승자가 확인하는 화면
export function DetoursPage() {
  const { crewId } = useParams()

  return (
    <Page title="우회 거리 확인" back>
      <Card>
        <p className="text-gray-500">크루 {crewId}</p>
      </Card>
    </Page>
  )
}
