import { useParams } from 'react-router'

// 운전자가 계산한 우회 거리를 동승자가 확인하는 화면
export function DetoursPage() {
  const { crewId } = useParams()

  return (
    <main className="p-6">
      <h1 className="text-xl font-bold text-gray-900">우회 거리 확인</h1>
      <p className="mt-2 text-gray-500">크루 {crewId}</p>
    </main>
  )
}
