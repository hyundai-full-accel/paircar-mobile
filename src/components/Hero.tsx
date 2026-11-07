import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

type HeroProps = {
  image: string // src/assets의 일러스트
  className?: string
  children: ReactNode
}

// 화면 위쪽 그림 영역 (시안 "판교 출근 크루 7:10 ~ 8:32", "약 2분 후 도착")
// 일러스트를 바닥에 깔고 왼쪽에 글자를 얹음. 그림은 꾸밈이라 읽지 않게 함
export function Hero({ image, className, children }: HeroProps) {
  return (
    <section className={cn('relative -mx-5 overflow-hidden bg-hero', className)}>
      <img src={image} alt="" aria-hidden className="absolute inset-0 size-full object-cover object-right-bottom" />
      <div className="relative flex flex-col px-5 pt-6 pb-7">{children}</div>
    </section>
  )
}

// 그림 영역 안의 가로 구분선
export function HeroDivider() {
  return <div className="my-4 h-px bg-[#CDD5E2]" />
}
