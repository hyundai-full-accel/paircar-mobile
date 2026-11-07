export type TimelineItem = {
  time?: string // "07:10". 없으면 비워 둠
  text: string
}

// 세로 파란 줄 + 점 (시안 "경로 상세", "탑승 타임라인")
export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="relative flex flex-col gap-5 pl-6">
      <span aria-hidden className="absolute top-2 bottom-2 left-[5px] w-0.5 bg-brand" />
      {items.map((item, i) => (
        <li key={i} className="relative flex items-baseline gap-5 text-[15px]">
          <span aria-hidden className="absolute top-1.5 -left-6 size-3 rounded-full bg-brand ring-4 ring-white" />
          <span className="w-12 shrink-0 font-semibold tabular-nums">{item.time ?? '—'}</span>
          <span className="text-sub">{item.text}</span>
        </li>
      ))}
    </ol>
  )
}
