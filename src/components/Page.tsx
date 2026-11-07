import { ChevronDown, ChevronLeft } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router'
import { cn } from '../lib/cn'

type PageProps = {
  title?: ReactNode
  back?: boolean // 왼쪽 위 뒤로 가기
  sections?: Section[] // 있으면 제목 옆 ∨ 를 눌러 다른 화면으로 감 (시안 "오늘의 카풀 ∨")
  action?: ReactNode // 오른쪽 위 버튼 (HeaderButton)
  className?: string
  children: ReactNode
}

export type Section = { label: string; to: string }

// 화면 하나의 틀: 위 헤더 + 내용 (좌우 여백 20px)
export function Page({ title, back = false, sections, action, className, children }: PageProps) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-1 flex-col">
      {(title || back || action) && (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-1 bg-white/95 px-3 backdrop-blur">
          {back && (
            <button
              type="button"
              aria-label="뒤로"
              onClick={() => navigate(-1)}
              className="flex size-10 items-center justify-center rounded-full text-ink active:bg-surface"
            >
              <ChevronLeft className="size-7" />
            </button>
          )}
          <div className={cn('min-w-0 flex-1', !back && 'pl-2')}>
            {sections ? <SectionMenu title={title} sections={sections} /> : <h1 className="truncate text-[22px] font-bold">{title}</h1>}
          </div>
          {action}
        </header>
      )}
      <main className={cn('flex flex-1 flex-col gap-4 px-5 pb-8', className)}>{children}</main>
    </div>
  )
}

// 오른쪽 위 동그란 회색 버튼 (시안 "알림", "초대")
export function HeaderButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-11 items-center justify-center rounded-full bg-surface text-[13px] font-medium text-sub active:bg-line"
    >
      {children}
    </button>
  )
}

function SectionMenu({ title, sections }: { title: ReactNode; sections: Section[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-[22px] font-bold"
      >
        <h1 className="truncate">{title}</h1>
        <ChevronDown className={cn('size-6 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <nav role="menu" className="absolute top-full left-0 mt-2 flex w-48 flex-col rounded-2xl border border-line bg-white p-2 shadow-lg">
          {sections.map((section) => (
            <NavLink
              key={section.to}
              to={section.to}
              end
              role="menuitem"
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn('rounded-xl px-3 py-3 text-base', isActive ? 'bg-surface font-bold' : 'text-sub active:bg-surface')
              }
            >
              {section.label}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  )
}
