import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'

type ModalProps = {
  open: boolean
  onClose: () => void
  title?: string // 있으면 위쪽 제목 줄과 닫기 버튼
  children: ReactNode
}

// 가운데 뜨는 상자 (시안 "크루 초대하기", "정상적으로 요청을 보냈어요")
// 바깥을 누르거나 Esc를 누르면 닫힘
export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-8" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex w-full max-w-sm flex-col gap-4 rounded-3xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between">
            <h2 className="text-[17px] font-bold">{title}</h2>
            <button type="button" aria-label="닫기" onClick={onClose} className="text-ink">
              <X className="size-6" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
