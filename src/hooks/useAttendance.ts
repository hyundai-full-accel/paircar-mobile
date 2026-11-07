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

export type AttendanceChange = { date: string; attending: boolean; boardPlaceId: number | null }

// 내 그날 출석 바꾸기. 바뀌면 운전자에게 rider.attendance-changed가 감
export function useChangeAttendance(crewId: number, crewMemberId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ date, attending, boardPlaceId }: AttendanceChange) =>
      unwrap(
        api.PUT('/api/crews/{crewId}/members/{crewMemberId}/attendance/{date}', {
          params: { path: { crewId, crewMemberId, date } },
          body: { attending, boardPlaceId },
        }),
      ),
    onSuccess: (_, { date }) => queryClient.invalidateQueries({ queryKey: attendanceKey(crewId, date) }),
  })
}
