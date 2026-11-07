import { useParams } from 'react-router'
import { Card } from '../components/Card'
import { Page } from '../components/Page'

// 초대 링크, QR로 들어오는 화면 (1단계에서 코드 확인 → 닉네임 입력 → 크루 참여, 토큰 저장)
export function JoinPage() {
  const { code } = useParams()

  return (
    <Page title="크루 참여">
      <Card>
        <p className="text-gray-500">초대 코드 {code}</p>
      </Card>
    </Page>
  )
}
