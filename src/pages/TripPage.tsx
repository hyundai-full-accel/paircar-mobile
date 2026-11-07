import { useParams } from 'react-router'

// 진행 중인 운행. 차 위치, 도착 예정, 탑승 상태를 실시간(SSE)으로 보여 줌
export function TripPage() {
  const { tripId } = useParams()

  return (
    <main className="p-6">
      <h1 className="text-xl font-bold text-gray-900">운행</h1>
      <p className="mt-2 text-gray-500">운행 {tripId}</p>
    </main>
  )
}
