import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query'
import { api, unwrap } from '../api/client'

const attendanceKey = (crewId: number, date: string) => ['crews', crewId, 'attendance', date]

function fetchAttendance(crewId: number, date: string) {
  return unwrap(api.GET('/api/crews/{crewId}/attendance/{date}', { params: { path: { crewId, date } } }))
}

// 여러 날의 크루 전원 출석. 날짜마다 한 번씩 부름 (카풀 날 몇 개라 적음)
export function useAttendances(crewId: number, dates: string[]) {
  return useQueries({
    queries: dates.map((date) => ({
      queryKey: attendanceKey(crewId, date),
      queryFn: () => fetchAttendance(crewId, date),
    })),
  })
}

// 그날 출석 전체 값. 안 보낸 값은 지워지므로 그날 탈 곳, 지각은 바꾸지 않을 때도 지금 값을 같이 보냄
export type AttendanceChange = { date: string; attending: boolean; boardPlaceId: number | null; delayMinutes?: number | null }

// 내 그날 출석 바꾸기. 바뀌면 운전자에게 rider.attendance-changed가 감
export function useChangeAttendance(crewId: number, crewMemberId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ date, attending, boardPlaceId, delayMinutes = null }: AttendanceChange) =>
      unwrap(
        api.PUT('/api/crews/{crewId}/members/{crewMemberId}/attendance/{date}', {
          params: { path: { crewId, crewMemberId, date } },
          body: { attending, boardPlaceId, delayMinutes },
        }),
      ),
    onSuccess: (_, { date }) => queryClient.invalidateQueries({ queryKey: attendanceKey(crewId, date) }),
  })
}
