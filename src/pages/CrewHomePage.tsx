import { CalendarCheck, CarFront, ChevronRight, Clock, MapPin } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import type { Crew, CrewMember, Trip } from '../api/types'
import { Card } from '../components/Card'
import { Page } from '../components/Page'
import { ErrorView, LoadingView } from '../components/StatusView'
import { useAttendances } from '../hooks/useAttendance'
import { useCrew, useCrewMembers, useCurrentTrip } from '../hooks/useCrew'
import { useMe } from '../hooks/useMe'
import { cn } from '../lib/cn'
import { formatServiceDate, upcomingCarpoolDays } from '../lib/dates'
import { formatClock, formatDays } from '../lib/format'
import { NotFoundPage } from './NotFoundPage'

// 크루 홈: 진행 중인 운행, 다음 카풀 날 내 출석, 크루 기본 일정, 크루원
export function CrewHomePage() {
  const crewId = Number(useParams().crewId)
  if (!Number.isInteger(crewId)) return <NotFoundPage />
  return <CrewHome crewId={crewId} />
}

function CrewHome({ crewId }: { crewId: number }) {
  const crew = useCrew(crewId)
  const members = useCrewMembers(crewId)
  const currentTrip = useCurrentTrip(crewId)
  const me = useMe()

  const retry = () => Promise.all([crew.refetch(), members.refetch()])

  let content
  if (crew.isError || members.isError) {
    content = <ErrorView error={crew.error ?? members.error} onRetry={retry} />
  } else if (crew.isPending || members.isPending) {
    content = <LoadingView />
  } else {
    const myMember = members.data.find((it) => it.memberId === me.data?.memberId)
    content = (
      <>
        {currentTrip.data && <CurrentTripBanner trip={currentTrip.data} />}
        {myMember && <NextCarpoolCard crew={crew.data} myMember={myMember} />}
        <ScheduleCard crew={crew.data} />
        <MemberList crewId={crewId} members={members.data} myMemberId={me.data?.memberId} drivingMemberId={currentTrip.data?.driverMemberId} />
      </>
    )
  }

  return <Page title={crew.data?.name ?? '크루'}>{content}</Page>
}

function CurrentTripBanner({ trip }: { trip: Trip }) {
  return (
    <Link to={`/trips/${trip.tripId}`}>
      <Card className="flex items-center gap-3 bg-brand text-white active:bg-brand-strong">
        <CarFront className="size-6 shrink-0" />
        <div className="flex flex-1 flex-col">
          <span className="font-semibold">{trip.driverNickname}님이 운전 중이에요</span>
          <span className="text-sm text-white/80">눌러서 차 위치와 도착 시간을 보세요</span>
        </div>
        <ChevronRight className="size-5 shrink-0" />
      </Card>
    </Link>
  )
}

// 다음 카풀 날 내가 타는지. 눌러서 출석을 바꿈
function NextCarpoolCard({ crew, myMember }: { crew: Crew; myMember: CrewMember }) {
  const [date] = upcomingCarpoolDays(crew.departureDays, 1)
  const [attendance] = useAttendances(crew.crewId, [date])
  const mine = attendance.data?.find((it) => it.crewMemberId === myMember.crewMemberId)

  let status = '\u00a0'
  if (mine) status = mine.attending ? (mine.boardPlace ? `${mine.boardPlace.name}에서 타요` : '타요') : '안 타요'

  return (
    <Link to={`/crews/${crew.crewId}/attendance`}>
      <Card className="flex items-center gap-3 active:bg-gray-50">
        <CalendarCheck className={cn('size-6 shrink-0', mine?.attending === false ? 'text-gray-400' : 'text-brand')} />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-sm text-gray-500">{formatServiceDate(date)} 카풀</span>
          <span className={cn('truncate font-semibold', mine?.attending === false && 'text-gray-500')}>{status}</span>
        </div>
        <span className="shrink-0 text-sm text-brand">출석 바꾸기</span>
      </Card>
    </Link>
  )
}

function ScheduleCard({ crew }: { crew: Crew }) {
  const hasSchedule = crew.departureTime || crew.departureDays.length > 0
  const hasRoute = crew.originPlace && crew.destinationPlace

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="font-semibold">평소 일정</h2>
      <Row icon={<Clock className="size-5" />}>
        {hasSchedule ? (
          [crew.departureDays.length > 0 && formatDays(crew.departureDays), crew.departureTime && `${formatClock(crew.departureTime)} 출발`]
            .filter(Boolean)
            .join(' ')
        ) : (
          <span className="text-gray-400">운전자가 아직 정하지 않았어요</span>
        )}
      </Row>
      {hasRoute && (
        <Row icon={<MapPin className="size-5" />}>
          {crew.originPlace!.name} → {crew.destinationPlace!.name}
        </Row>
      )}
    </Card>
  )
}

type MemberListProps = {
  crewId: number
  members: CrewMember[]
  myMemberId?: number
  drivingMemberId?: number // 지금 운전 중인 사람
}

// 내 줄을 누르면 평소 탈 곳을 정하는 화면으로 감
function MemberList({ crewId, members, myMemberId, drivingMemberId }: MemberListProps) {
  return (
    <Card className="flex flex-col gap-1">
      <h2 className="mb-2 font-semibold">크루원 {members.length}명</h2>
      <ul className="flex flex-col divide-y divide-gray-100">
        {members.map((member) => {
          const isMe = member.memberId === myMemberId
          const row = <MemberRow member={member} isMe={isMe} driving={member.memberId === drivingMemberId} />
          return (
            <li key={member.crewMemberId}>
              {isMe ? (
                <Link to={`/crews/${crewId}/my-places`} className="-mx-2 flex items-center rounded-xl px-2 active:bg-gray-50">
                  {row}
                  <ChevronRight className="size-5 shrink-0 text-gray-400" />
                </Link>
              ) : (
                row
              )}
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

function MemberRow({ member, isMe, driving }: { member: CrewMember; isMe: boolean; driving: boolean }) {
  const place = placeText(member, isMe)
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3 py-3">
      <div
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-full font-semibold',
          isMe ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600',
        )}
      >
        {member.nickname.slice(0, 1)}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center gap-1.5 font-medium">
          {member.nickname}
          {isMe && <Badge className="bg-brand-soft text-brand">나</Badge>}
          {driving && <Badge className="bg-green-50 text-green-700">운전 중</Badge>}
        </span>
        {place && <span className={cn('truncate text-sm', isMe && !member.boardPlace ? 'text-brand' : 'text-gray-500')}>{place}</span>}
      </div>
    </div>
  )
}

// 평소 탈 곳, 내릴 곳. 운전자는 탈 곳이 없으므로 남의 빈 값은 숨기고, 내 것만 정하라고 안내
function placeText(member: CrewMember, isMe: boolean): string | null {
  if (member.boardPlace && member.alightPlace) return `${member.boardPlace.name} → ${member.alightPlace.name}`
  if (member.boardPlace) return `${member.boardPlace.name}에서 타요`
  return isMe ? '평소 탈 곳을 정해 주세요' : null
}

function Badge({ className, children }: { className: string; children: ReactNode }) {
  return <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', className)}>{children}</span>
}

function Row({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-gray-700">
      <span className="text-gray-400">{icon}</span>
      <span>{children}</span>
    </div>
  )
}
