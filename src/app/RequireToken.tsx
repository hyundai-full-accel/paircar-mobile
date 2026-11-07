import { Link2 } from 'lucide-react'
import { Outlet } from 'react-router'
import { Card } from '../components/Card'
import { Page } from '../components/Page'
import { useToken } from '../hooks/useToken'
import { LiveProvider } from './LiveProvider'

// 토큰이 있어야 하는 화면. 없으면(처음 왔거나 만료됨) 초대 링크로 들어오라고 안내
// 페어카는 로그인이 없고, 초대 링크로 참여할 때 받은 토큰으로만 나를 구분함
// 토큰이 있는 동안에만 실시간 연결(LiveProvider)을 유지함
export function RequireToken() {
  const token = useToken()
  if (token) {
    return (
      <LiveProvider>
        <Outlet />
      </LiveProvider>
    )
  }

  return (
    <Page>
      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-brand-soft text-brand">
          <Link2 className="size-8" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold">초대 링크로 들어와 주세요</h1>
          <p className="text-gray-600">운전자에게 받은 초대 링크나 QR로 들어오면 크루에 참여할 수 있어요.</p>
        </div>
        <Card className="w-full text-left text-sm text-gray-600">
          이전에 참여했는데 이 화면이 보이면, 브라우저 데이터가 지워졌거나 기기가 바뀐 거예요. 운전자에게 초대 링크를 다시 받아 주세요.
        </Card>
      </div>
    </Page>
  )
}
