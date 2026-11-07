import { Bell, X } from 'lucide-react'
import { useNavigate } from 'react-router'
import type { LiveNotice } from '../lib/liveMessages'

export type ToastItem = LiveNotice & { id: number }

// 화면 위쪽에 잠깐 뜨는 알림. 누르면 관련 화면으로 감
export function ToastStack({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: number) => void }) {
  const navigate = useNavigate()
  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 mx-auto flex max-w-md flex-col gap-2 px-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className="pointer-events-auto flex items-start gap-3 rounded-2xl bg-gray-900/95 p-4 text-white shadow-lg"
        >
          <Bell className="mt-0.5 size-5 shrink-0 text-blue-300" />
          <button
            type="button"
            className="flex flex-1 flex-col text-left"
            onClick={() => {
              if (toast.url) navigate(toast.url)
              onDismiss(toast.id)
            }}
          >
            <span className="font-semibold">{toast.title}</span>
            {toast.body && <span className="text-sm text-gray-300">{toast.body}</span>}
          </button>
          <button type="button" aria-label="알림 닫기" onClick={() => onDismiss(toast.id)} className="text-gray-400">
            <X className="size-5" />
          </button>
        </div>
      ))}
    </div>
  )
}
