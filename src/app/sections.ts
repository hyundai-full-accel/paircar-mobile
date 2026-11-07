import type { Section } from '../components/Page'

// 제목 옆 ∨ 메뉴로 오가는 크루 화면 (시안의 네 화면)
export function crewSections(crewId: number): Section[] {
  return [
    { label: '오늘의 카풀', to: `/crews/${crewId}` },
    { label: '내 크루 관리', to: `/crews/${crewId}/manage` },
    { label: '탑승 기록', to: `/crews/${crewId}/history` },
    { label: '월별 정산', to: `/crews/${crewId}/settlement` },
  ]
}
