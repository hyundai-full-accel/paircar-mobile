import { ChevronRight } from 'lucide-react'
import type { HTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router'
import { cn } from '../lib/cn'

// 흰 바탕 + 연한 테두리 카드 (시안의 "크루 정보", "경로 상세" 상자)
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-2xl border border-line bg-white p-5', className)} {...props} />
}

// 제목이 있는 카드. to가 있으면 제목 줄 오른쪽에 > 를 붙이고 누르면 그리로 감
export function SectionCard({ title, to, className, children }: { title: string; to?: string; className?: string; children: ReactNode }) {
  const heading = (
    <div className="flex items-center justify-between">
      <h2 className="text-[17px] font-bold">{title}</h2>
      {to && <ChevronRight className="size-5 text-ink" />}
    </div>
  )
  return (
    <Card className={cn('flex flex-col gap-4', className)}>
      {to ? <Link to={to}>{heading}</Link> : heading}
      <div className="h-px bg-line" />
      {children}
    </Card>
  )
}
