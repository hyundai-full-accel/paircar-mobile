// 날짜, 금액 표시. 서버 시각은 UTC라 한국 시간으로 바꿔 보여 줌
const TIME_ZONE = 'Asia/Seoul'

const monthDay = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', timeZone: TIME_ZONE })

// "11월 14일"
export function formatMonthDay(iso: string): string {
  return monthDay.format(new Date(iso))
}
