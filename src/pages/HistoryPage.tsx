import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import type { CrewMember, CrewPlace, Detour, Receipt, RiderSummary, TripSummary } from '../api/types'
import { crewSections } from '../app/sections'
import { Card } from '../components/Card'
import { NotificationButton } from '../components/NotificationButton'
import { Page } from '../components/Page'
import { EmptyView, ErrorView, LoadingView } from '../components/StatusView'
import { ChipTabs, MonthTabs, UnderlineTabs } from '../components/Tabs'
import { Timeline } from '../components/Timeline'
import { useCrewView } from '../hooks/useCrew'
import { useCrewPlaces } from '../hooks/usePlaces'
import { useMyReceipts } from '../hooks/useReceipts'
import { useCrewDetours, useTripsOfMonth } from '../hooks/useTrip'
import { cn } from '../lib/cn'
import {
  addDays,
  addMonths,
  crewMonths,
  currentMonthKst,
  formatMonth,
  formatMonthSpan,
  formatShortDate,
  formatTimeKst,
  todayKst,
} from '../lib/dates'
import { formatKm, formatWon } from '../lib/format'
import { NotFoundPage } from './NotFoundPage'

// 탑승 기록 (시안 M06/07): 월별(달마다 탄 횟수, 거리, 우회, 금액)과 일별(주간 달력 + 그날 타임라인)
// 운행 목록에 내가 실제로 탄 운행만 추림. 금액은 영수증이 나온 달만 (매달 1일에 지난달 것이 나옴)
// 경로 지도는 아직 없음
export function HistoryPage() {
  const crewId = Number(useParams().crewId)
  if (!Number.isInteger(crewId)) return <NotFoundPage />
  return <History crewId={crewId} />
}

type Ctx = { crewId: number; me: CrewMember; months: string[]; places: CrewPlace[]; detours: Detour[] }

function History({ crewId }: { crewId: number }) {
  const view = useCrewView(crewId)
  const places = useCrewPlaces(crewId)
  const detours = useCrewDetours(crewId)
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('view') === 'day' ? 'day' : 'month'

  let content
  if (view.error || places.error || detours.error) {
    content = <ErrorView error={view.error ?? places.error ?? detours.error} onRetry={view.refetch} />
  } else if (view.isPending || places.isPending || detours.isPending || !view.members) {
    content = <LoadingView />
  } else if (!view.myMember) {
    content = <EmptyView message="이 크루의 멤버가 아니에요." />
  } else {
    const ctx: Ctx = {
      crewId,
      me: view.myMember,
      months: crewMonths(view.members.map((it) => it.joinedAt)),
      places: places.data,
      detours: detours.data,
    }
    content = tab === 'month' ? <MonthlyHistory ctx={ctx} /> : <DailyHistory ctx={ctx} />
  }

  return (
    <Page title="탑승 기록" sections={crewSections(crewId)} action={<NotificationButton />}>
      <UnderlineTabs
        options={[
          { value: 'month', label: '월별 기록' },
          { value: 'day', label: '일별 기록' },
        ]}
        value={tab}
        onChange={(value) => setSearchParams({ view: value }, { replace: true })}
      />
      {content}
    </Page>
  )
}

// 내가 탄 운행 하나 (운행 + 내 탑승 + 영수증에서 찾은 금액)
type Ride = {
  trip: TripSummary
  rider: RiderSummary
  date: string
  detourKm: number
  amountWon: number | null // 영수증이 나오기 전이면 null
}

// 운행 목록에서 내가 실제로 탄 것만. 우회 거리는 영수증이 있으면 그 값, 없으면 둘 다 확인한 우회 거리로 어림
function myRides(ctx: Ctx, trips: TripSummary[], receipts: Receipt[]): Ride[] {
  const items = receipts.filter((it) => it.payerCrewMemberId === ctx.me.crewMemberId).flatMap((it) => it.items)
  const placeName = new Map(ctx.places.map((it) => [it.placeId, it.name]))
  return trips.flatMap((trip) => {
    const rider = trip.riders.find((it) => it.crewMemberId === ctx.me.crewMemberId && it.boardedAt)
    if (!rider) return []
    const item = items.find((it) => it.boardingId === rider.boardingId)
    const estimatedDetour = ctx.detours
      .filter((d) => d.passengerId === ctx.me.crewMemberId && d.driverId === trip.driverCrewMemberId && d.confirmed)
      .filter((d) => {
        const name = placeName.get(d.placeId)
        const onMyWay = name === rider.boardPlaceName || name === rider.alightPlaceName
        return onMyWay && name !== trip.originName && name !== trip.destinationName
      })
      .reduce((sum, d) => sum + d.detourKm, 0)
    return [{ trip, rider, date: trip.serviceDate, detourKm: item?.detourKm ?? estimatedDetour, amountWon: item?.amountWon ?? null }]
  })
}

function MonthlyHistory({ ctx }: { ctx: Ctx }) {
  const lastClosed = addMonths(currentMonthKst(), -1)
  const [month, setMonth] = useState(ctx.months.includes(currentMonthKst()) ? currentMonthKst() : ctx.months[ctx.months.length - 1])
  const [day, setDay] = useState('all')
  const trips = useTripsOfMonth(ctx.crewId, month)
  const receipts = useMyReceipts(ctx.crewId, month)

  let body
  if (trips.isPending || receipts.isPending) body = <LoadingView />
  else if (trips.error || receipts.error) body = <ErrorView error={trips.error ?? receipts.error} onRetry={() => trips.refetch()} />
  else {
    const rides = myRides(ctx, trips.data, receipts.data)
    const dates = [...new Set(rides.map((it) => it.date))]
    const selected = day === 'all' ? rides : rides.filter((it) => it.date === day)
    const receiptTotal = receipts.data.filter((it) => it.payerCrewMemberId === ctx.me.crewMemberId).reduce((sum, it) => sum + it.amountWon, 0)
    body =
      rides.length === 0 ? (
        <EmptyView message="이 달에는 탄 기록이 없어요." />
      ) : (
        <Card className="flex flex-col gap-4 shadow-sm">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[17px] font-bold">{formatMonth(month)} 탑승 기록</h2>
            <span className="text-xs text-sub">{formatMonthSpan(month)}</span>
          </div>
          <ChipTabs
            options={[{ value: 'all', label: '전체' }, ...dates.map((it) => ({ value: it, label: formatShortDate(it) }))]}
            value={dates.includes(day) ? day : 'all'}
            onChange={setDay}
          />
          {day !== 'all' && selected.map((ride) => <RideTimeline key={ride.rider.boardingId} ride={ride} />)}
          <RideStats
            rides={selected}
            monthly={day === 'all'}
            amount={day === 'all' ? (receiptTotal > 0 ? receiptTotal : null) : sumAmount(selected)}
            pendingText={month > lastClosed ? '다음 달 1일에 나와요' : '영수증 없음'}
          />
          <ReceiptLink crewId={ctx.crewId} month={month} />
        </Card>
      )
  }

  return (
    <>
      <MonthTabs
        options={ctx.months.map((it) => ({ value: it, label: formatMonth(it) }))}
        value={month}
        onChange={(value) => {
          setMonth(value)
          setDay('all')
        }}
      />
      {body}
    </>
  )
}

const WEEK_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// 그 주 월요일 (YYYY-MM-DD)
function mondayOf(date: string) {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay() // 0 = 일
  return addDays(date, day === 0 ? -6 : 1 - day)
}

function DailyHistory({ ctx }: { ctx: Ctx }) {
  const [date, setDate] = useState(todayKst())
  const monday = mondayOf(date)
  const week = WEEK_LABELS.map((_, i) => addDays(monday, i))
  // 한 주가 두 달에 걸칠 수 있어서 시작 달, 끝 달을 둘 다 부름 (같으면 한 번만 요청됨)
  const firstMonth = week[0].slice(0, 7)
  const lastMonth = week[6].slice(0, 7)
  const trips = [useTripsOfMonth(ctx.crewId, firstMonth), useTripsOfMonth(ctx.crewId, lastMonth)]
  const receipts = [useMyReceipts(ctx.crewId, firstMonth), useMyReceipts(ctx.crewId, lastMonth)]

  const loaded = trips.every((it) => it.data) && receipts.every((it) => it.data)
  const error = [...trips, ...receipts].find((it) => it.error)?.error
  const rides = loaded
    ? myRides(
        ctx,
        dedupe(trips.flatMap((it) => it.data ?? []), (it) => it.tripId),
        dedupe(receipts.flatMap((it) => it.data ?? []), (it) => it.receiptId),
      )
    : []
  const dayRides = rides.filter((it) => it.date === date)
  const rideDates = new Set(rides.map((it) => it.date))

  return (
    <>
      <div className="flex items-center gap-1">
        <button type="button" aria-label="지난주" onClick={() => setDate(addDays(monday, -7))} className="text-muted">
          <ChevronLeft className="size-5" />
        </button>
        <div className="grid flex-1 grid-cols-7">
          {week.map((d, i) => {
            const active = d === date
            return (
              <button key={d} type="button" aria-pressed={active} onClick={() => setDate(d)} className="flex flex-col items-center gap-0.5 py-1">
                <span className={cn('text-[13px]', active ? 'font-bold text-brand' : 'text-sub')}>{WEEK_LABELS[i]}</span>
                <span className={cn('text-[17px] tabular-nums', active ? 'font-bold text-brand' : 'text-ink')}>{Number(d.slice(8, 10))}</span>
                <span aria-hidden className={cn('size-1 rounded-full', rideDates.has(d) ? (active ? 'bg-brand' : 'bg-muted') : 'bg-transparent')} />
              </button>
            )
          })}
        </div>
        <button type="button" aria-label="다음 주" onClick={() => setDate(addDays(monday, 7))} className="text-muted">
          <ChevronRight className="size-5" />
        </button>
      </div>

      {error ? (
        <ErrorView error={error} />
      ) : !loaded ? (
        <LoadingView />
      ) : dayRides.length === 0 ? (
        <EmptyView message={`${formatShortDate(date)}에는 탄 기록이 없어요.`} />
      ) : (
        <>
          <Card className="flex flex-col gap-4">
            <h2 className="text-[17px] font-bold">탑승 타임라인</h2>
            <div className="h-px bg-line" />
            {dayRides.map((ride) => (
              <RideTimeline key={ride.rider.boardingId} ride={ride} />
            ))}
            <p className="text-xs text-muted">*변경한 내용은 운전자에게 음성으로 전달돼요.</p>
          </Card>
          <Card className="flex flex-col gap-4">
            <h2 className="text-[17px] font-bold">탑승 기록</h2>
            <div className="h-px bg-line" />
            <RideStats rides={dayRides} monthly={false} amount={sumAmount(dayRides)} pendingText={date.slice(0, 7) >= currentMonthKst() ? '다음 달 1일에 나와요' : '영수증 없음'} />
          </Card>
          <ReceiptLink crewId={ctx.crewId} month={date.slice(0, 7)} />
        </>
      )}
    </>
  )
}

function dedupe<T>(list: T[], key: (it: T) => number) {
  return [...new Map(list.map((it) => [key(it), it])).values()]
}

function sumAmount(rides: Ride[]): number | null {
  return rides.some((it) => it.amountWon === null) ? null : rides.reduce((sum, it) => sum + (it.amountWon ?? 0), 0)
}

// 운전자 출발 → 내가 탄 곳 → 내린 곳 (시각은 한국 시간)
function RideTimeline({ ride }: { ride: Ride }) {
  const { trip, rider } = ride
  return (
    <Timeline
      items={[
        { time: formatTimeKst(trip.startedAt), text: `${trip.driverNickname}님 출발` },
        { time: rider.boardedAt ? formatTimeKst(rider.boardedAt) : undefined, text: `${rider.boardPlaceName}에서 탑승` },
        { time: rider.alightedAt ? formatTimeKst(rider.alightedAt) : undefined, text: `${rider.alightPlaceName}에서 하차` },
      ]}
    />
  )
}

function RideStats({ rides, monthly, amount, pendingText }: { rides: Ride[]; monthly: boolean; amount: number | null; pendingText: string }) {
  const shared = rides.reduce((sum, it) => sum + (it.rider.rideDistanceKm ?? 0), 0)
  const detour = rides.reduce((sum, it) => sum + it.detourKm, 0)
  return (
    <dl className="flex flex-col gap-2.5 text-[15px]">
      {monthly && <StatRow label="이번 달 탑승">{rides.length}회</StatRow>}
      <StatRow label="함께 탄 거리">{formatKm(shared)}</StatRow>
      <div className="h-px bg-line" />
      <StatRow label={monthly ? '누적 추가 우회 거리' : '추가 우회 거리'} strong>
        + {formatKm(detour)}
      </StatRow>
      <StatRow label="정산 금액" strong>
        {amount === null ? <span className="text-sm font-medium text-muted">{pendingText}</span> : `${formatWon(amount)}원`}
      </StatRow>
    </dl>
  )
}

function StatRow({ label, strong = false, children }: { label: string; strong?: boolean; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={strong ? 'font-semibold' : 'text-sub'}>{label}</dt>
      <dd className={cn('tabular-nums', strong ? 'text-lg font-bold' : 'font-medium')}>{children}</dd>
    </div>
  )
}

function ReceiptLink({ crewId, month }: { crewId: number; month: string }) {
  return (
    <Link
      to={`/crews/${crewId}/settlement?month=${month}`}
      className="flex h-13 items-center justify-center rounded-xl bg-ink-strong text-base font-semibold text-white active:bg-ink"
    >
      영수증 상세 보기
    </Link>
  )
}
