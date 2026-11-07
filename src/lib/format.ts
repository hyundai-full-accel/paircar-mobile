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

// 시안 표기: 7일 → "매일", 이어진 요일 → "월-금", 그 밖은 "월 · 수 · 금"
export function formatDays(days: DayOfWeek[]): string {
  const indexes = DAY_ORDER.map((day, i) => (days.includes(day) ? i : -1)).filter((i) => i >= 0)
  if (indexes.length === 7) return '매일'
  const consecutive = indexes.length >= 3 && indexes.every((n, i) => i === 0 || n === indexes[i - 1] + 1)
  if (consecutive) return `${DAY_LABEL[DAY_ORDER[indexes[0]]]}-${DAY_LABEL[DAY_ORDER[indexes[indexes.length - 1]]]}`
  return indexes.map((i) => DAY_LABEL[DAY_ORDER[i]]).join(' · ')
}

// "2026.11.07" (KST)
export function formatDotDate(iso: string | Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(new Date(iso))
  return parts.replaceAll('-', '.')
}

// 남은 거리: 403m, 1.5km
export function formatDistance(meters: number): string {
  return meters < 1000 ? `${Math.round(meters)}m` : `${(meters / 1000).toFixed(1)}km`
}

// 남은 시간: "약 2분 후 도착", 1분 안이면 "곧 도착"
export function formatEta(seconds: number): string {
  const minutes = Math.ceil(seconds / 60)
  return minutes <= 1 ? '곧 도착' : `약 ${minutes}분 후 도착`
}
