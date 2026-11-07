import { createBrowserRouter } from 'react-router'
import { DetoursPage } from '../pages/DetoursPage'
import { HomePage } from '../pages/HomePage'
import { JoinPage } from '../pages/JoinPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { ReceiptPage } from '../pages/ReceiptPage'
import { TripPage } from '../pages/TripPage'
import { AppLayout } from './AppLayout'

// 서버가 만드는 주소와 맞춰야 함
// - /join/:code: 초대 링크, QR (PAIRCAR_INVITE_BASE_URL)
// - /trips/:tripId, /crews/:crewId/detours, /receipts/:receiptId: 폰 알림을 누르면 여는 주소 (서버 PushMessages)
export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/join/:code', element: <JoinPage /> },
      { path: '/trips/:tripId', element: <TripPage /> },
      { path: '/crews/:crewId/detours', element: <DetoursPage /> },
      { path: '/receipts/:receiptId', element: <ReceiptPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
