import { ChevronRight, Users } from 'lucide-react'
import { Link, Navigate } from 'react-router'
import { Card } from '../components/Card'
import { Page } from '../components/Page'
import { EmptyView, ErrorView, LoadingView } from '../components/StatusView'
import { useMyCrews } from '../hooks/useCrew'

// 내 크루 목록. 크루가 하나면(대부분) 바로 그 크루 홈으로 감
export function HomePage() {
  const { data: crews, isPending, error, refetch } = useMyCrews()

  if (crews?.length === 1) return <Navigate to={`/crews/${crews[0].crewId}`} replace />

  return (
    <Page title="내 크루">
      {isPending ? (
        <LoadingView />
      ) : error ? (
        <ErrorView error={error} onRetry={() => refetch()} />
      ) : crews.length === 0 ? (
        <EmptyView message="아직 참여한 크루가 없어요. 운전자에게 받은 초대 링크로 들어와 주세요." />
      ) : (
        <ul className="flex flex-col gap-3">
          {crews.map((crew) => (
            <li key={crew.crewId}>
              <Link to={`/crews/${crew.crewId}`}>
                <Card className="flex items-center gap-3 active:bg-surface">
                  <div className="flex size-10 items-center justify-center rounded-full bg-brand-soft text-brand">
                    <Users className="size-5" />
                  </div>
                  <span className="flex-1 font-semibold">{crew.name}</span>
                  <ChevronRight className="size-5 text-muted" />
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Page>
  )
}
