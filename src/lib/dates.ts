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

// 정산 월, 탑승 기록 월은 "YYYY-MM" (서버 month와 같은 형식)

export function currentMonthKst(): string {
  return todayKst().slice(0, 7)
}

export function addMonths(month: string, months: number): string {
  const [year, m] = month.split('-').map(Number)
  const d = new Date(Date.UTC(year, m - 1 + months, 1))
  return d.toISOString().slice(0, 7)
}

// from부터 to까지 (둘 다 포함). from이 더 늦으면 to 하나
export function monthRange(from: string, to: string): string[] {
  const result: string[] = []
  for (let month = from < to ? from : to; month <= to && result.length < 120; month = addMonths(month, 1)) result.push(month)
  return result
}

// "10월"
export function formatMonth(month: string): string {
  return `${Number(month.slice(5, 7))}월`
}

// "[10.1 ~ 10.31]"
export function formatMonthSpan(month: string): string {
  const m = Number(month.slice(5, 7))
  const last = new Date(Date.UTC(Number(month.slice(0, 4)), m, 0)).getUTCDate()
  return `[${m}.1 ~ ${m}.${last}]`
}

// "10/3"
export function formatShortDate(date: string): string {
  return `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`
}

// 서버 UTC 시각 → 한국 시간 "07:32"
export function formatTimeKst(iso: string): string {
  return new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Seoul' }).format(new Date(iso))
}

// 서버 UTC 시각 → 한국 날짜 "YYYY-MM-DD"
export function dateKst(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date(iso))
}

// 크루에 처음 들어온 달부터 이번 달까지 (크루원 참여 시각 중 가장 이른 것 기준)
export function crewMonths(joinedAts: string[]): string[] {
  const first = [...joinedAts].sort()[0]
  return monthRange(first ? dateKst(first).slice(0, 7) : currentMonthKst(), currentMonthKst())
}
