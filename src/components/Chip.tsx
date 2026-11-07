import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

// 회색 알약 라벨 (시안 "월-금", "오전 07:10 출발")
export function Chip({ className, children }: { className?: string; children: ReactNode }) {
  return <span className={cn('inline-flex h-8 items-center rounded-full bg-black/5 px-3.5 text-sm font-medium', className)}>{children}</span>
}
