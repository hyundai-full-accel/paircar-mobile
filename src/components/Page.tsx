import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { cn } from '../lib/cn'

type PageProps = {
  title?: string
  back?: boolean // 왼쪽 위 뒤로 가기
  action?: ReactNode // 오른쪽 위 버튼
  className?: string
  children: ReactNode
}

// 화면 하나의 틀: 위 헤더 + 내용
export function Page({ title, back = false, action, className, children }: PageProps) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-1 flex-col">
      {(title || back || action) && (
        <header className="sticky top-0 z-10 flex h-14 items-center gap-1 bg-gray-100/90 px-2 backdrop-blur">
          {back && (
            <button
              type="button"
              aria-label="뒤로"
              onClick={() => navigate(-1)}
              className="flex size-10 items-center justify-center rounded-full text-gray-700 active:bg-gray-200"
            >
              <ChevronLeft className="size-6" />
            </button>
          )}
          <h1 className={cn('flex-1 truncate text-lg font-bold', !back && 'px-3')}>{title}</h1>
          {action}
        </header>
      )}
      <main className={cn('flex flex-1 flex-col gap-4 px-4 pt-2 pb-8', className)}>{children}</main>
    </div>
  )
}
