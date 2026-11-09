import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import type { CrewMember, CrewPlace } from '../api/types'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Page } from '../components/Page'
import { PlaceChooser } from '../components/PlaceChooser'
import { EmptyView, ErrorView, LoadingView } from '../components/StatusView'
import { useCrewMembers } from '../hooks/useCrew'
import { useMe } from '../hooks/useMe'
import { useChangeMemberPlaces, useCrewPlaces, useCreatePlace } from '../hooks/usePlaces'
import { errorMessage } from '../lib/errors'
import { NotFoundPage } from './NotFoundPage'

// 평소 탈 곳, 내릴 곳. 운전자는 출발 전에 이 값(과 그날 출석)으로 경유지를 정함
export function MyPlacesPage() {
  const crewId = Number(useParams().crewId)
  if (!Number.isInteger(crewId)) return <NotFoundPage />
  return <MyPlaces crewId={crewId} />
}

function MyPlaces({ crewId }: { crewId: number }) {
  const me = useMe()
  const members = useCrewMembers(crewId)
  const places = useCrewPlaces(crewId)

  let content
  if (me.isError || members.isError || places.isError) {
    content = <ErrorView error={me.error ?? members.error ?? places.error} />
  } else if (me.isPending || members.isPending || places.isPending) {
    content = <LoadingView />
  } else {
    const myMember = members.data.find((it) => it.memberId === me.data.memberId)
    content = myMember ? (
      <MyPlacesForm key={myMember.crewMemberId} crewId={crewId} member={myMember} places={places.data} />
    ) : (
      <EmptyView message="이 크루의 멤버가 아니에요." />
    )
  }

  return (
    <Page title="평소 탈 곳" back>
      {content}
    </Page>
  )
}

function MyPlacesForm({ crewId, member, places }: { crewId: number; member: CrewMember; places: CrewPlace[] }) {
  const navigate = useNavigate()
  const [boardPlaceId, setBoardPlaceId] = useState(member.boardPlace?.placeId ?? null)
  const [alightPlaceId, setAlightPlaceId] = useState(member.alightPlace?.placeId ?? null)
  const save = useChangeMemberPlaces(crewId, member.crewMemberId)
  const createPlace = useCreatePlace(crewId)

  const unchanged = boardPlaceId === (member.boardPlace?.placeId ?? null) && alightPlaceId === (member.alightPlace?.placeId ?? null)
  const samePlace = boardPlaceId !== null && boardPlaceId === alightPlaceId

  const onSave = () =>
    save.mutate({ boardPlaceId, alightPlaceId, pickupTime: member.pickupTime ?? null }, { onSuccess: () => navigate(`/crews/${crewId}`, { replace: true }) })

  return (
    <>
      <p className="px-1 text-sm text-sub">
        운전자가 출발 전에 이 장소로 경유지를 잡아요. 목록에 없으면 지도에서 직접 찍어 새 장소로 추가해요. 그날만 다른 곳에서 탈 때는 출석에서
        바꾸면 돼요.
      </p>
      <Card className="flex flex-col gap-2">
        <h2 className="font-semibold">어디서 탈까요?</h2>
        <PlaceChooser label="탈 곳" places={places} selectedId={boardPlaceId} onSelect={setBoardPlaceId} onCreate={createPlace} />
      </Card>
      <Card className="flex flex-col gap-2">
        <h2 className="font-semibold">어디서 내릴까요?</h2>
        <PlaceChooser label="내릴 곳" places={places} selectedId={alightPlaceId} onSelect={setAlightPlaceId} onCreate={createPlace} />
      </Card>
      {samePlace && <p className="text-sm text-red-600">탈 곳과 내릴 곳이 같아요.</p>}
      {save.error && <p className="text-sm text-red-600">{errorMessage(save.error)}</p>}
      <Button block loading={save.isPending} disabled={unchanged || samePlace} onClick={onSave}>
        저장
      </Button>
    </>
  )
}
