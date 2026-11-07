import { Outlet } from 'react-router'

// 폰 화면 기준 한 열. 넓은 화면에서도 가운데 폰 폭으로 보여 줌
export function AppLayout() {
  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col bg-white pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <Outlet />
    </div>
  )
}
