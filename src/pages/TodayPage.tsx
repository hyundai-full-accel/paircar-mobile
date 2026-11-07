import { CalendarX, Check, Clock, MapPin } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import type { Crew, CrewMember, Trip } from '../api/types'
import { crewSections } from '../app/sections'
import heroCar from '../assets/hero-car.jpg'
import { Card } from '../components/Card'
import { Chip } from '../components/Chip'
import { Hero, HeroDivider } from '../components/Hero'
import { NotificationButton } from '../components/NotificationButton'
import { Page } from '../components/Page'
import { EmptyView, ErrorView, LoadingView } from '../components/StatusView'
import { useAttendances } from '../hooks/useAttendance'
import { useCrewView, useCurrentTrip } from '../hooks/useCrew'
import { useTripNotice, useTripRequest, useVehicle } from '../hooks/useTrip'
import { cn } from '../lib/cn'
import { formatServiceDate, todayKst, upcomingCarpoolDays } from '../lib/dates'
import { errorMessage } from '../lib/errors'
import { formatDistance, formatDotDate, formatEta } from '../lib/format'
import { NotFoundPage } from './NotFoundPage'

// 오늘의 카풀 (시안 M04): 차가 어디쯤인지, 내가 탔는지, 오늘 바꿀 것
// 운행 중이면 실시간 값(남은 거리·시간, 곧 도착)으로, 운행 전이면 다음 카풀 날 내 출석으로 위쪽을 채움
export function TodayPage() {
  const crewId = Number(useParams().crewId)
  if (!Number.isInteger(crewId)) return <NotFoundPage />
  return <Today crewId={crewId} />
}

function Today({ crewId }: { crewId: number }) {
  const view = useCrewView(crewId)
  const currentTrip = useCurrentTrip(crewId)

  let content
  if (view.error) {
    content = <ErrorView error={view.error} onRetry={view.refetch} />
  } else if (view.isPending || currentTrip.isPending || !view.crew) {
    content = <LoadingView />
  } else if (!view.myMember) {
    content = <EmptyView message="이 크루의 멤버가 아니에요." />
  } else {
    const trip = currentTrip.data ?? null
    content = (
      <>
        {trip ? <TripHero trip={trip} me={view.myMember} /> : <NextCarpoolHero crew={view.crew} me={view.myMember} />}
        {trip && <MyBoardingCard trip={trip} me={view.myMember} />}
        <ChangeTiles crewId={crewId} />
      </>
    )
  }

  return (
    <Page title="오늘의 카풀" sections={crewSections(crewId)} action={<NotificationButton />}>
      {content}
    </Page>
  )
}

// 운행 중: "지훈님과 남은 거리 403m", "[차량 접근 중] 약 2분 후 도착"
function TripHero({ trip, me }: { trip: Trip; me: CrewMember }) {
  const vehicle = useVehicle(trip.tripId)
  const notice = useTripNotice(trip.tripId)
  const myBoarding = trip.boardings.find((it) => it.crewMemberId === me.crewMemberId)

  let label = '[이동 중]'
  let headline: ReactNode = '곧 차 위치가 표시돼요'
  if (myBoarding?.alightedAt) {
    label = '[하차 완료]'
    headline = '오늘도 수고했어요'
  } else if (myBoarding?.boardedAt) {
    label = '[탑승 중]'
    headline = '함께 이동하고 있어요'
  } else if (notice?.type === 'vehicle.arrived') {
    label = '[차량 도착]'
    headline = '승차 지점에 도착했어요'
  } else if (notice?.type === 'driver.delayed') {
    label = '[운전자 지각]'
    headline = `${notice.data.minutes}분 늦어요`
  } else if (vehicle?.remainSeconds != null) {
    label = notice?.type === 'vehicle.approaching' ? '[차량 접근 중]' : '[이동 중]'
    headline = formatEta(vehicle.remainSeconds)
  } else if (!myBoarding) {
    label = '[오늘 불참]'
    headline = '이번 운행에서 빠졌어요'
  }

  return (
    <Hero image={heroCar}>
      <p className="text-sm text-sub">{formatDotDate(trip.startedAt)}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-[17px] font-bold">{trip.driverNickname}님과 남은 거리</p>
        <p className="text-[32px] leading-none font-bold tabular-nums">
          {vehicle?.remainMeters != null && !myBoarding?.boardedAt ? formatDistance(vehicle.remainMeters) : '—'}
        </p>
      </div>
      <HeroDivider />
      <p className="text-[15px] text-sub">{label}</p>
      <p className="mt-2 text-[28px] font-bold">{headline}</p>
    </Hero>
  )
}

// 운행 전: 다음 카풀 날과 내가 타는지
function NextCarpoolHero({ crew, me }: { crew: Crew; me: CrewMember }) {
  const [date] = upcomingCarpoolDays(crew.departureDays, 1)
  const [attendance] = useAttendances(crew.crewId, [date])
  const mine = attendance.data?.find((it) => it.crewMemberId === me.crewMemberId)

  return (
    <Hero image={heroCar}>
      <p className="text-sm text-sub">{formatDotDate(new Date())}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-[17px] font-bold">다음 카풀</p>
        <p className="text-[22px] leading-none font-bold">{date === todayKst() ? '오늘' : formatServiceDate(date)}</p>
      </div>
      <HeroDivider />
      <p className="text-[15px] text-sub">[출발 전]{mine?.attending && mine.delayMinutes ? ` ${mine.delayMinutes}분 늦게 나간다고 알렸어요` : ''}</p>
      <p className={cn('mt-2 text-[28px] font-bold', mine?.attending === false && 'text-sub')}>
        {!mine ? ' ' : mine.attending ? (mine.boardPlace ? `${mine.boardPlace.name}에서 타요` : '타요') : '이날은 안 타요'}
      </p>
    </Hero>
  )
}

// 내 탑승 (시안 "내 탑승 · 차가 도착하면 탑승 여부를 기록해요"). 아직 안 탔으면 "탔어요"로 직접 알릴 수 있음
function MyBoardingCard({ trip, me }: { trip: Trip; me: CrewMember }) {
  const mine = trip.boardings.find((it) => it.crewMemberId === me.crewMemberId)
  const place = trip.waypoints.find((it) => it.placeId === mine?.boardPlaceId)
  const { boarded } = useTripRequest(trip.tripId, me.crewMemberId)
  const canReport = mine !== undefined && !mine.boardedAt

  let status = '픽업 예정'
  if (!mine) status = '불참'
  else if (mine.alightedAt) status = '하차 완료'
  else if (mine.boardedAt) status = '탑승 완료'

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-surface-soft p-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          role="checkbox"
          aria-checked={Boolean(mine?.boardedAt)}
          aria-label="탔어요"
          disabled={!canReport || boarded.isPending}
          onClick={() => boarded.mutate()}
          className={cn(
            'flex size-6 shrink-0 items-center justify-center rounded-md border-2',
            mine?.boardedAt ? 'border-sub bg-sub text-white' : 'border-[#C4C9D4] bg-white',
          )}
        >
          {mine?.boardedAt && <Check className="size-4" strokeWidth={3} />}
        </button>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-[17px] font-bold">내 탑승</span>
          <span className="truncate text-sm text-sub">
            {place ? `${place.name} · ` : ''}
            {canReport ? '탔으면 눌러서 운전자에게 알려요.' : '차가 도착하면 탑승 여부를 기록해요.'}
          </span>
        </div>
        <Chip className="shrink-0 bg-white">{status}</Chip>
      </div>
      {boarded.error && <p className="text-sm text-red-600">{errorMessage(boarded.error)}</p>}
    </div>
  )
}

// 오늘 변경할 내용 (지각, 불참, 지점 변경) → 변경 사항 요청 화면
function ChangeTiles({ crewId }: { crewId: number }) {
  const tiles = [
    { type: 'late', title: '지각', sub: '5 / 10 min', icon: <Clock className="size-5" /> },
    { type: 'absent', title: '불참', sub: '오늘은 안 타요', icon: <CalendarX className="size-5" /> },
    { type: 'place', title: '지점 변경', sub: '오늘만 다른 곳', icon: <MapPin className="size-5" /> },
  ]
  return (
    <section className="flex flex-col gap-3 pt-3">
      <h2 className="text-[17px] font-bold">오늘 변경할 내용이 있나요?</h2>
      <div className="grid grid-cols-3 gap-2">
        {tiles.map((tile) => (
          <Link key={tile.type} to={`/crews/${crewId}/request?type=${tile.type}`}>
            <Card className="flex h-32 flex-col justify-between border-0 bg-surface-soft p-4 active:bg-surface">
              <span className="text-sub">{tile.icon}</span>
              <span className="flex flex-col">
                <span className="font-bold">{tile.title}</span>
                <span className="text-xs text-muted">{tile.sub}</span>
              </span>
            </Card>
          </Link>
        ))}
      </div>
      <p className="text-xs text-muted">*변경된 내용은 운전자에게 음성으로 전달돼요.</p>
    </section>
  )
}
