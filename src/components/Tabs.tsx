import { useEffect, useRef } from 'react'
import { cn } from '../lib/cn'

type Option = { value: string; label: string }

// 월 탭 (시안 "5월 6월 ... 10월", 선택된 달은 파란 글자 + 점). 선택된 탭이 보이게 가로로 밀어 둠
export function MonthTabs({ options, value, onChange }: { options: Option[]; value: string; onChange: (value: string) => void }) {
  const selected = useRef<HTMLButtonElement>(null)
  // 중괄호로 감싸 아무것도 돌려주지 않음. 최신 크롬은 scrollIntoView가 Promise를 돌려줘서,
  // 그대로 돌려주면 React가 정리 함수로 알고 불러 "destroy is not a function"으로 죽음
  useEffect(() => {
    selected.current?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [value])

  return (
    <div role="tablist" className="-mx-5 flex gap-1 overflow-x-auto px-5 [scrollbar-width:none]">
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            ref={active ? selected : undefined}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn('relative flex h-11 min-w-12 shrink-0 items-center justify-center px-2 text-[17px]', active ? 'font-bold text-brand' : 'text-ink')}
          >
            {option.label}
            {active && <span aria-hidden className="absolute bottom-1 size-1 rounded-full bg-brand" />}
          </button>
        )
      })}
    </div>
  )
}

// 날짜 칩 (시안 "전체 10/1 10/3 ..."). 선택된 칩은 테두리
export function ChipTabs({ options, value, onChange }: { options: Option[]; value: string; onChange: (value: string) => void }) {
  return (
    <div role="tablist" className="-mx-5 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none]">
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'h-9 shrink-0 rounded-full px-4 text-sm font-medium',
              active ? 'border-2 border-ink bg-white' : 'border border-transparent bg-surface text-sub',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

// 밑줄 탭 (시안 "월별 기록 | 일별 기록")
export function UnderlineTabs({ options, value, onChange }: { options: Option[]; value: string; onChange: (value: string) => void }) {
  return (
    <div role="tablist" className="flex gap-5">
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn('h-10 border-b-2 text-[17px]', active ? 'border-ink font-bold' : 'border-transparent text-sub')}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
