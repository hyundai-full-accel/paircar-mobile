import { Card } from '../components/Card'
import { Page } from '../components/Page'
import { ErrorView, LoadingView } from '../components/StatusView'
import { useMe } from '../hooks/useMe'

// 크루 홈 (2단계에서 크루 정보, 진행 중 운행을 붙임)
export function HomePage() {
  const { data: me, isPending, error, refetch } = useMe()

  return (
    <Page title="페어카">
      {isPending ? (
        <LoadingView />
      ) : error ? (
        <ErrorView error={error} onRetry={() => refetch()} />
      ) : (
        <Card>
          <p className="text-gray-700">{me.nickname}님, 안녕하세요.</p>
        </Card>
      )}
    </Page>
  )
}
