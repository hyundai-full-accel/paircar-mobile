import { createBrowserRouter } from 'react-router'
import { AttendancePage } from '../pages/AttendancePage'
import { ComingSoonPage } from '../pages/ComingSoonPage'
import { DetoursPage } from '../pages/DetoursPage'
import { HomePage } from '../pages/HomePage'
import { JoinPage } from '../pages/JoinPage'
import { ManagePage } from '../pages/ManagePage'
import { MyPlacesPage } from '../pages/MyPlacesPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { ReceiptPage } from '../pages/ReceiptPage'
import { RequestPage } from '../pages/RequestPage'
import { TodayPage } from '../pages/TodayPage'
import { TripPage } from '../pages/TripPage'
import { AppLayout } from './AppLayout'
import { RequireToken } from './RequireToken'

// 서버가 만드는 주소와 맞춰야 함
// - /join/:code: 초대 링크, QR (PAIRCAR_INVITE_BASE_URL)
// - /trips/:tripId, /crews/:crewId/detours, /receipts/:receiptId: 폰 알림을 누르면 여는 주소 (서버 PushMessages)
export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/join/:code', element: <JoinPage /> },
      {
        element: <RequireToken />,
        children: [
          { path: '/', element: <HomePage /> },
          { path: '/crews/:crewId', element: <TodayPage /> },
          { path: '/crews/:crewId/request', element: <RequestPage /> },
          { path: '/crews/:crewId/manage', element: <ManagePage /> },
          { path: '/crews/:crewId/history', element: <ComingSoonPage title="탑승 기록" /> },
          { path: '/crews/:crewId/settlement', element: <ComingSoonPage title="월별 정산" /> },
          { path: '/crews/:crewId/my-places', element: <MyPlacesPage /> },
          { path: '/crews/:crewId/attendance', element: <AttendancePage /> },
          { path: '/trips/:tripId', element: <TripPage /> },
          { path: '/crews/:crewId/detours', element: <DetoursPage /> },
          { path: '/receipts/:receiptId', element: <ReceiptPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
