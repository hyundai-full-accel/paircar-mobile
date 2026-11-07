import type { ReactNode } from 'react'

// 라벨 – 값 한 줄 (시안 "운전자 ... 민혁")
export function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 text-[15px]">
      <dt className="shrink-0 text-sub">{label}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  )
}

export function InfoList({ children }: { children: ReactNode }) {
  return <dl className="flex flex-col gap-3">{children}</dl>
}
