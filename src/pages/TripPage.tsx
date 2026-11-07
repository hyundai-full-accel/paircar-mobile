import { Navigate, useParams } from 'react-router'
import { Page } from '../components/Page'
import { ErrorView, LoadingView } from '../components/StatusView'
import { useTrip } from '../hooks/useTrip'
import { NotFoundPage } from './NotFoundPage'

// 폰 알림(출발, 곧 도착)을 누르면 서버가 정한 /trips/:tripId로 열림
// 운행 화면은 크루의 "오늘의 카풀"이라 그 크루로 보냄
export function TripPage() {
  const tripId = Number(useParams().tripId)
  if (!Number.isInteger(tripId)) return <NotFoundPage />
  return <TripRedirect tripId={tripId} />
}

function TripRedirect({ tripId }: { tripId: number }) {
  const { data: trip, error, refetch } = useTrip(tripId)
  if (trip) return <Navigate to={`/crews/${trip.crewId}`} replace />
  return <Page title="오늘의 카풀">{error ? <ErrorView error={error} onRetry={() => refetch()} /> : <LoadingView />}</Page>
}
