import type { LiveEvent } from '../api/live'

export type LiveNotice = { title: string; body?: string; url?: string }

// 앱을 보고 있을 때 띄울 알림 문구. 서버 Web Push 문구(PushMessages)와 맞춤
// null이면 화면 데이터만 바꾸고 알림은 띄우지 않음
export function noticeOf(event: LiveEvent): LiveNotice | null {
  const tripUrl = event.tripId ? `/trips/${event.tripId}` : undefined
  switch (event.type) {
    case 'trip.started':
      return { title: `${event.data.driverNickname}님이 출발했어요`, body: '도착 예정 시간을 확인해 보세요', url: tripUrl }
    case 'vehicle.approaching':
      return { title: '차가 곧 도착해요', body: '지금 나가면 딱 맞아요', url: tripUrl }
    case 'vehicle.arrived':
      return { title: '차가 도착했어요', body: '승차 지점에서 기다리고 있어요', url: tripUrl }
    case 'driver.delayed':
      return { title: `${event.data.driverNickname}님이 ${event.data.minutes}분 늦어요`, body: '천천히 나오셔도 돼요', url: tripUrl }
    case 'detour.confirm-requested':
      return {
        title: '우회 거리를 확인해 주세요',
        body: `${event.data.placeName} ${event.data.detourKm}km`,
        url: `/crews/${event.data.crewId}/detours`,
      }
    case 'receipt.issued':
      return {
        title: `${Number(event.data.month.split('-')[1])}월 영수증이 도착했어요`,
        body: `보낼 금액 ${event.data.amountWon.toLocaleString('ko-KR')}원`,
        url: `/receipts/${event.data.receiptId}`,
      }
    default:
      return null
  }
}
