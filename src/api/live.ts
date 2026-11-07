// 서버 SSE 이벤트 (GET /api/live/events). OpenAPI에 없어서 서버 LiveEvent.kt와 손으로 맞춤
// SSE event 이름 = type, data = { type, tripId, data, occurredAt } JSON

type Place = { placeId: number; name: string; latitude: number; longitude: number }

// 동승자 웹이 받는 이벤트와 내용
export type LiveEventMap = {
  'trip.started': { driverNickname: string }
  'vehicle.location': { latitude: number; longitude: number; remainSeconds: number | null; remainMeters: number | null }
  'vehicle.approaching': { crewMemberId: number; nickname: string }
  'vehicle.arrived': { crewMemberId: number; nickname: string }
  'rider.boarded': { crewMemberId: number; nickname: string }
  'driver.delayed': { driverNickname: string; minutes: number }
  'trip.ended': null
  'rider.attendance-changed': {
    crewId: number
    crewMemberId: number
    nickname: string
    serviceDate: string
    attending: boolean
    boardPlace: Place | null
    delayMinutes: number | null
  }
  'detour.confirm-requested': {
    detourId: number
    crewId: number
    placeName: string
    detourKm: number
    driverNickname: string
    passengerNickname: string
  }
  'receipt.issued': { receiptId: number; month: string; amountWon: number; payeeNickname: string }
}

export type LiveEventType = keyof LiveEventMap

export const LIVE_EVENT_TYPES = [
  'trip.started',
  'vehicle.location',
  'vehicle.approaching',
  'vehicle.arrived',
  'rider.boarded',
  'driver.delayed',
  'trip.ended',
  'rider.attendance-changed',
  'detour.confirm-requested',
  'receipt.issued',
] as const satisfies readonly LiveEventType[]

export type LiveEvent = {
  [T in LiveEventType]: { type: T; tripId?: number; data: LiveEventMap[T]; occurredAt: string }
}[LiveEventType]
