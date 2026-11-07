import { Copy } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useParams, useSearchParams } from 'react-router'
import type { CrewMember, Receipt, ReceiptItem } from '../api/types'
import { crewSections } from '../app/sections'
import { BottomBar } from '../components/BottomBar'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { NotificationButton } from '../components/NotificationButton'
import { Page } from '../components/Page'
import { EmptyView, ErrorView, LoadingView } from '../components/StatusView'
import { ChipTabs, MonthTabs } from '../components/Tabs'
import { useCrewView } from '../hooks/useCrew'
import { useMyReceipts } from '../hooks/useReceipts'
import { cn } from '../lib/cn'
import { addMonths, crewMonths, currentMonthKst, formatMonth, formatMonthSpan, formatShortDate } from '../lib/dates'
import { formatKm, formatWon } from '../lib/format'
import { NotFoundPage } from './NotFoundPage'

// 월별 정산 (시안 M08): 달마다 보낼 금액, 영수증 내역(날짜별로 보기), 받을 계좌 복사
// 영수증은 매달 1일에 지난달 것이 발행됨. 이번 달은 아직 영수증이 없음
export function SettlementPage() {
  const crewId = Number(useParams().crewId)
  if (!Number.isInteger(crewId)) return <NotFoundPage />
  return <Settlement crewId={crewId} />
}

function Settlement({ crewId }: { crewId: number }) {
  const view = useCrewView(crewId)

  let content
  if (view.error) {
    content = <ErrorView error={view.error} onRetry={view.refetch} />
  } else if (view.isPending || !view.members) {
    content = <LoadingView />
  } else if (!view.myMember) {
    content = <EmptyView message="이 크루의 멤버가 아니에요." />
  } else {
    content = <MonthlySettlement crewId={crewId} members={view.members} me={view.myMember} />
  }

  return (
    <Page title="월별 정산" sections={crewSections(crewId)} action={<NotificationButton />}>
      {content}
    </Page>
  )
}

function MonthlySettlement({ crewId, members, me }: { crewId: number; members: CrewMember[]; me: CrewMember }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const months = crewMonths(members.map((it) => it.joinedAt))
  const lastClosed = addMonths(currentMonthKst(), -1)
  const requested = searchParams.get('month')
  // 기본은 영수증이 있는 지난달 (크루가 이번 달에 시작했으면 이번 달)
  const month = requested && months.includes(requested) ? requested : months.includes(lastClosed) ? lastClosed : months[months.length - 1]
  const receipts = useMyReceipts(crewId, month)

  const paying = receipts.data?.filter((it) => it.payerCrewMemberId === me.crewMemberId) ?? []
  const receiving = receipts.data?.filter((it) => it.payeeCrewMemberId === me.crewMemberId) ?? []

  let body
  if (receipts.isPending) body = <LoadingView />
  else if (receipts.error) body = <ErrorView error={receipts.error} onRetry={() => receipts.refetch()} />
  else if (receipts.data.length === 0)
    body = <EmptyView message={month >= currentMonthKst() ? '이번 달 영수증은 다음 달 1일에 나와요.' : '이 달에는 영수증이 없어요.'} />
  else
    body = (
      <>
        {paying.length > 0 && <TotalCard title="총 정산 금액" receipts={paying} />}
        {paying.map((receipt) => (
          <ReceiptCard key={receipt.receiptId} month={month} receipt={receipt} paying />
        ))}
        {receiving.length > 0 && <TotalCard title="받을 금액" receipts={receiving} />}
        {receiving.map((receipt) => (
          <ReceiptCard key={receipt.receiptId} month={month} receipt={receipt} paying={false} />
        ))}
        {paying.length > 0 && <AccountCard receipt={paying[0]} />}
      </>
    )

  return (
    <>
      <MonthTabs
        options={months.map((it) => ({ value: it, label: formatMonth(it) }))}
        value={month}
        onChange={(value) => setSearchParams({ month: value }, { replace: true })}
      />
      {body}
    </>
  )
}

// 총 정산 금액 (탑승일, 함께 탄 거리, 우회 거리)
function TotalCard({ title, receipts }: { title: string; receipts: Receipt[] }) {
  const sum = (pick: (it: Receipt) => number) => receipts.reduce((total, it) => total + pick(it), 0)
  const days = new Set(receipts.flatMap((it) => it.items.map((item) => item.serviceDate))).size
  return (
    <Card className="flex flex-col gap-5 shadow-sm">
      <div className="flex items-baseline justify-between">
        <span className="text-[15px] font-bold">{title}</span>
        <span className="text-[30px] leading-none font-bold tabular-nums">
          {formatWon(sum((it) => it.amountWon))} <span className="text-lg font-medium">원</span>
        </span>
      </div>
      <div className="h-px bg-line" />
      <div className="grid grid-cols-3">
        <Stat label="탑승일" value={`${days}일`} />
        <Stat label="함께 탄 거리" value={formatKm(sum((it) => it.sharedDistanceKm))} />
        <Stat label="우회거리" value={formatKm(sum((it) => it.detourKm))} />
      </div>
    </Card>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-sub">{label}</span>
      <span className="text-[17px] font-bold">{value}</span>
    </div>
  )
}

// 월 영수증. "전체"는 계산 내역, 날짜를 고르면 그날 내역
function ReceiptCard({ month, receipt, paying }: { month: string; receipt: Receipt; paying: boolean }) {
  const [day, setDay] = useState('all')
  const dates = [...new Set(receipt.items.map((it) => it.serviceDate))].sort()
  const dayItems = receipt.items.filter((it) => it.serviceDate === day)

  return (
    <Card className="flex flex-col gap-4 bg-surface-soft">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[17px] font-bold">
          {formatMonth(month)} 영수증
          <span className="ml-2 text-sm font-medium text-sub">{paying ? `→ ${receipt.payeeNickname}` : `← ${receipt.payerNickname}`}</span>
        </h2>
        <span className="text-xs text-sub">{formatMonthSpan(month)}</span>
      </div>
      <ChipTabs
        options={[{ value: 'all', label: '전체' }, ...dates.map((it) => ({ value: it, label: formatShortDate(it) }))]}
        value={day}
        onChange={setDay}
      />
      <div className="h-0.5 bg-ink" />
      {day === 'all' ? <MonthBreakdown receipt={receipt} /> : <DayBreakdown items={dayItems} />}
    </Card>
  )
}

function MonthBreakdown({ receipt }: { receipt: Receipt }) {
  const days = new Set(receipt.items.map((it) => it.serviceDate)).size
  const detourPerDay = days > 0 ? receipt.detourKm / days : 0
  return (
    <>
      <Rows>
        <Row label="함께 탄 거리">{formatKm(receipt.sharedDistanceKm)}</Row>
        <Row label={receipt.detourKm > 0 ? `우회 거리 (${detourPerDay.toFixed(1)}km × ${days}일)` : '우회 거리'}>{formatKm(receipt.detourKm)}</Row>
        <Row label="내 부담 거리">{formatKm(receipt.ownDistanceKm)}</Row>
      </Rows>
      <div className="border-t border-dashed border-[#C4C9D4]" />
      <Rows>
        <Row label={`평균 연비 (${receipt.fuelEconomySource === 'MEASURED' ? '차량 측정' : '직접 입력'})`}>{receipt.fuelEconomy}km/L</Row>
        <Row label="평균 유가">{formatWon(receipt.fuelPriceWon)}원/L</Row>
        <Row label="유류비">{formatWon(receipt.fuelCostWon)}원</Row>
        <Row label="통행료">{formatWon(receipt.tollWon)}원</Row>
        <Row label="100원 단위 올림">+{formatWon(receipt.roundingWon)}원</Row>
      </Rows>
      <div className="h-px bg-line" />
      <AmountLine amount={receipt.amountWon} />
    </>
  )
}

function DayBreakdown({ items }: { items: ReceiptItem[] }) {
  const sum = (pick: (it: ReceiptItem) => number) => items.reduce((total, it) => total + pick(it), 0)
  return (
    <>
      <Rows>
        <Row label="함께 탄 거리">{formatKm(sum((it) => it.sharedDistanceKm))}</Row>
        <Row label="함께 탄 구간 유류비">{formatWon(sum((it) => it.sharedCostWon))}원</Row>
        <Row label="우회 거리">{formatKm(sum((it) => it.detourKm))}</Row>
        <Row label="우회 유류비">{formatWon(sum((it) => it.detourCostWon))}원</Row>
        <Row label="통행료">{formatWon(sum((it) => it.tollWon))}원</Row>
      </Rows>
      <div className="h-px bg-line" />
      <AmountLine label="이날 금액" amount={sum((it) => it.amountWon)} note="월 합계에서 100원 단위로 올림해요" />
    </>
  )
}

function AmountLine({ label = '총 정산 금액', amount, note }: { label?: string; amount: number; note?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(String(Math.round(amount)))
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[15px] font-bold">{label}</span>
        <button type="button" onClick={copy} aria-label="금액 복사" className="flex items-center gap-1.5 text-xl font-bold tabular-nums">
          {formatWon(amount)}원
          <Copy className={cn('size-4', copied ? 'text-brand' : 'text-ink')} />
        </button>
      </div>
      {note && <span className="text-xs text-muted">{note}</span>}
    </div>
  )
}

// 정산 받을 계좌 + 계좌 복사하기
function AccountCard({ receipt }: { receipt: Receipt }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${receipt.payeeBankName} ${receipt.payeeAccountNumber}`)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }
  return (
    <>
      <Card className="flex flex-col gap-4">
        <h2 className="text-[17px] font-bold">정산 받을 계좌</h2>
        <div className="h-px bg-line" />
        <div className="flex flex-col gap-1">
          <span className="text-[19px] font-bold">
            {receipt.payeeBankName} {receipt.payeeAccountNumber}
          </span>
          <span className="text-sm text-sub">예금주 {receipt.payeeAccountHolder}</span>
        </div>
      </Card>
      <BottomBar>
        <Button block onClick={copy}>
          <Copy className="size-5" />
          {copied ? '복사했어요' : '계좌 복사하기'}
        </Button>
      </BottomBar>
    </>
  )
}

function Rows({ children }: { children: ReactNode }) {
  return <dl className="flex flex-col gap-2.5">{children}</dl>
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 text-[15px]">
      <dt className="text-sub">{label}</dt>
      <dd className="font-medium tabular-nums">{children}</dd>
    </div>
  )
}
