import { useParams } from 'react-router'

// 초대 링크, QR로 들어오는 화면. 코드 확인 → 닉네임 입력 → 크루 참여, 토큰 저장
export function JoinPage() {
  const { code } = useParams()

  return (
    <main className="p-6">
      <h1 className="text-xl font-bold text-gray-900">크루 참여</h1>
      <p className="mt-2 text-gray-500">초대 코드 {code}</p>
    </main>
  )
}
