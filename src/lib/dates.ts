import type { DayOfWeek } from '../api/types'

// 운행일은 한국 날짜 기준 "YYYY-MM-DD" 문자열로 다룸 (서버 serviceDate와 같은 형식)
// 계산은 그 날짜의 UTC 자정으로 해서 기기 시간대와 상관없게 함

export function todayKst(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date())
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

const DAYS: DayOfWeek[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
const DAY_SHORT = ['일', '월', '화', '수', '목', '금', '토']

export function dayOfWeek(date: string): DayOfWeek {
  return DAYS[new Date(`${date}T00:00:00Z`).getUTCDay()]
}

// 오늘부터 count개의 카풀 날. 크루 요일이 없으면 매일로 봄
export function upcomingCarpoolDays(days: DayOfWeek[], count: number, from = todayKst()): string[] {
  const result: string[] = []
  for (let i = 0; result.length < count && i < 31; i++) {
    const date = addDays(from, i)
    if (days.length === 0 || days.includes(dayOfWeek(date))) result.push(date)
  }
  return result
}

// "오늘 (월)", "내일 (화)", "11월 12일 (수)"
export function formatServiceDate(date: string, today = todayKst()): string {
  const d = new Date(`${date}T00:00:00Z`)
  const short = DAY_SHORT[d.getUTCDay()]
  if (date === today) return `오늘 (${short})`
  if (date === addDays(today, 1)) return `내일 (${short})`
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 (${short})`
}
