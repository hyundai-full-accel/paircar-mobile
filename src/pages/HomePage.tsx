import { useMe } from '../hooks/useMe'
import { getToken } from '../lib/token'

export function HomePage() {
  const { data: me, isPending, error } = useMe()

  return (
    <main className="flex flex-1 flex-col gap-2 p-6">
      <h1 className="text-2xl font-bold text-gray-900">페어카</h1>
      <HomeStatus hasToken={getToken() !== null} nickname={me?.nickname} isPending={isPending} error={error} />
    </main>
  )
}

type HomeStatusProps = {
  hasToken: boolean
  nickname?: string
  isPending: boolean
  error: Error | null
}

function HomeStatus({ hasToken, nickname, isPending, error }: HomeStatusProps) {
  if (!hasToken) return <p className="text-gray-500">초대 링크로 들어와서 크루에 참여해 주세요.</p>
  if (error) return <p className="text-red-600">{error.message}</p>
  if (isPending) return <p className="text-gray-400">불러오는 중…</p>
  return <p className="text-gray-700">{nickname}님, 안녕하세요.</p>
}
