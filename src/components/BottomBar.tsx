import type { ReactNode } from 'react'

// 화면 아래 고정 버튼 자리 (시안 "크루 참여하기", "계좌 복사하기")
// 내용이 버튼에 가리지 않게 자리만큼 아래 여백을 함께 만듦
export function BottomBar({ children }: { children: ReactNode }) {
  return (
    <>
      <div aria-hidden className="h-24" />
      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md bg-gradient-to-t from-white via-white to-white/0 px-5 pt-6 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        {children}
      </div>
    </>
  )
}
