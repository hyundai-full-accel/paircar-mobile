import type { components } from './schema'

// 화면에서 자주 쓰는 서버 응답 타입. 생성 파일(schema.d.ts)의 긴 경로를 줄여 씀
type Schemas = components['schemas']

export type Crew = Schemas['CrewResult']
export type CrewMember = Schemas['CrewMemberResult']
export type CrewPlace = Schemas['CrewPlaceResult']
export type Trip = Schemas['TripResult']
export type Attendance = Schemas['AttendanceResult']
export type InvitePreview = Schemas['InvitePreviewResult']
export type Receipt = Schemas['ReceiptResult']
export type ReceiptItem = Schemas['ReceiptItemResult']
export type TripSummary = Schemas['TripSummaryResult']
export type RiderSummary = Schemas['RiderSummary']
export type Detour = Schemas['DetourResult']
export type DayOfWeek = Crew['departureDays'][number]
