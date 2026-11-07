import type { DayOfWeek } from '../api/types'

// 날짜, 시각, 요일 표시. 서버 시각은 UTC라 한국 시간으로 바꿔 보여 줌
const TIME_ZONE = 'Asia/Seoul'

const monthDay = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', timeZone: TIME_ZONE })

// "11월 14일"
export function formatMonthDay(iso: string): string {
  return monthDay.format(new Date(iso))
}

// 서버의 "08:00"(KST) → "오전 8:00"
export function formatClock(hhmm: string): string {
  const [hour, minute] = hhmm.split(':').map(Number)
  const period = hour < 12 ? '오전' : '오후'
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  return `${period} ${hour12}:${String(minute).padStart(2, '0')}`
}

const DAY_ORDER: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
const DAY_LABEL: Record<DayOfWeek, string> = {
  MONDAY: '월',
  TUESDAY: '화',
  WEDNESDAY: '수',
  THURSDAY: '목',
  FRIDAY: '금',
  SATURDAY: '토',
  SUNDAY: '일',
}

// ["MONDAY", ..., "FRIDAY"] → "평일", 7일 → "매일", 그 밖은 "월 · 수 · 금"
export function formatDays(days: DayOfWeek[]): string {
  const set = new Set(days)
  if (set.size === 7) return '매일'
  if (set.size === 5 && DAY_ORDER.slice(0, 5).every((day) => set.has(day))) return '평일'
  return DAY_ORDER.filter((day) => set.has(day))
    .map((day) => DAY_LABEL[day])
    .join(' · ')
}
