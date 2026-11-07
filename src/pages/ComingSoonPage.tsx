import { useParams } from 'react-router'
import { crewSections } from '../app/sections'
import { Page } from '../components/Page'
import { EmptyView } from '../components/StatusView'
import { NotFoundPage } from './NotFoundPage'

// 아직 만들지 않은 크루 화면 (내 크루 관리, 탑승 기록, 월별 정산). 메뉴로 오갈 수 있게 자리만 잡음
export function ComingSoonPage({ title }: { title: string }) {
  const crewId = Number(useParams().crewId)
  if (!Number.isInteger(crewId)) return <NotFoundPage />

  return (
    <Page title={title} sections={crewSections(crewId)}>
      <EmptyView message="곧 열려요." />
    </Page>
  )
}
