import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

// 동그란 체크 표시. 선택되면 진한 원에 흰 체크
export function CheckMark({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-6 shrink-0 items-center justify-center rounded-full border-2',
        checked ? 'border-sub bg-sub text-white' : 'border-[#C4C9D4] bg-white',
      )}
    >
      {checked && <Check className="size-3.5" strokeWidth={3.5} />}
    </span>
  )
}

type ChoiceCardProps = {
  title: string
  description?: string
  selected: boolean
  onSelect: () => void
}

// 하나를 고르는 큰 카드 (시안 "변경 사항 요청"의 조금 늦어요 / 오늘은 안 타요)
// 부모를 role="radiogroup"으로 감싸서 씀
export function ChoiceCard({ title, description, selected, onSelect }: ChoiceCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        'flex w-full flex-col gap-2 rounded-2xl border p-5 text-left transition-colors',
        selected ? 'border-line bg-[#E8EAED]' : 'border-transparent bg-surface-soft',
      )}
    >
      <span className="flex items-center gap-3 text-[17px] font-bold">
        <CheckMark checked={selected} />
        {title}
      </span>
      {description && <span className="pl-9 text-[15px] text-sub">{description}</span>}
    </button>
  )
}

// 체크 한 줄 (시안 "우회 거리 실비 정산 기준에 동의해요")
export function CheckRow({ checked, onChange, children }: { checked: boolean; onChange: (checked: boolean) => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-3 text-left text-[15px] font-semibold"
    >
      <CheckMark checked={checked} />
      {children}
    </button>
  )
}
