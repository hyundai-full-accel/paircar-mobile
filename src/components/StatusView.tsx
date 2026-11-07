import { CircleAlert, Inbox } from 'lucide-react'
import type { ReactNode } from 'react'
import { errorMessage } from '../lib/errors'
import { Button } from './Button'
import { Spinner } from './Spinner'

// 데이터를 기다리는 동안
export function LoadingView() {
  return (
    <div className="flex flex-1 items-center justify-center py-16 text-brand">
      <Spinner className="size-8" />
    </div>
  )
}

// 불러오기 실패. onRetry가 있으면 다시 시도 버튼
export function ErrorView({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
      <CircleAlert className="size-10 text-red-500" />
      <p className="text-ink">{errorMessage(error)}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          다시 시도
        </Button>
      )}
    </div>
  )
}

// 보여 줄 것이 없음
export function EmptyView({ message, children }: { message: string; children?: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
      <Inbox className="size-10 text-muted" />
      <p className="text-sub">{message}</p>
      {children}
    </div>
  )
}
