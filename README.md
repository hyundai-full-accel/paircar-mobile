# paircar-mobile

페어카 동승자 웹 (모바일웹, PWA). 초대 링크로 크루에 참여하고, 운행을 실시간으로 보고, 월 영수증을 받습니다.

서버: [`paircar-server`](../paircar-server)

## 실행

서버를 먼저 띄웁니다 (`paircar-server`에서).

```bash
docker compose -f infra/compose.yaml up -d --build --wait
```

웹앱을 띄웁니다.

```bash
npm install
npm run dev
```

- `http://localhost:3000`
- `VITE_API_BASE_URL`이 비어 있으면 `/api` 요청을 Vite가 `http://localhost`(서버 nginx)로 넘깁니다.

### 같은 Wi-Fi의 폰에서 열기

개발 서버는 LAN에도 열려 있습니다(`host: true`). 차량 앱 QR로 바로 열려면 서버 `infra/.env`의 초대 주소를 PC IP로 바꿉니다.

```
PAIRCAR_INVITE_BASE_URL=http://<PC IP>:3000/join
```

`http://<IP>` 주소는 보안 컨텍스트가 아니라서 **현재 위치**와 **폰 알림**은 동작하지 않습니다. 장소는 지도를 움직여 직접 고르면 됩니다.

## 스크립트

| 명령 | 용도 |
|---|---|
| `npm run dev` | 개발 서버 (3000) |
| `npm run build` | 타입 검사 후 `dist/`에 빌드. 아이콘, manifest, 서비스 워커도 함께 만듦 |
| `npm run preview` | 빌드 결과 확인 |
| `npm run lint` | ESLint |
| `npm run gen:api` | 서버가 내보낸 API 명세(`../paircar-server/build/openapi.json`)로 API 타입을 다시 만듦. 서버를 띄울 필요 없음. 먼저 서버에서 `./gradlew test --tests '*OpenApiExportTest'` 실행 |

## 구조

```
src/
├── api/          서버 호출 (schema.d.ts는 생성 파일, 직접 고치지 않음)
├── hooks/        TanStack Query 훅
├── lib/          토큰, Push, 서비스 워커 등록 같은 로직
├── app/          라우터, 레이아웃
├── pages/        화면
└── sw.ts         서비스 워커 (오프라인 캐시, 폰 알림)
```

`api`, `hooks`, `lib`는 React DOM을 쓰지 않습니다. 나중에 React Native 앱을 만들면 이 폴더를 그대로 옮길 수 있게 하려는 것입니다.

## 화면

| 주소 | 화면 |
|---|---|
| `/join/:code` | 초대 링크로 크루 참여 (토큰 없이 열림) |
| `/` | 내 크루 목록 |
| `/crews/:crewId` | 오늘 운행 (경로 지도) |
| `/crews/:crewId/request` | 지점 변경 요청 |
| `/crews/:crewId/attendance` | 출석 |
| `/crews/:crewId/my-places` | 평소 탈 곳 |
| `/crews/:crewId/detours` | 경유 요청 |
| `/crews/:crewId/history` | 운행 기록 |
| `/crews/:crewId/settlement` | 정산 |
| `/crews/:crewId/manage` | 크루 관리 (초대 QR) |
| `/trips/:tripId` | 운행 상세 |
| `/receipts/:receiptId` | 월 영수증 |

`/join/:code` 말고는 모두 `RequireToken` 안에 있어서 토큰이 없으면 들어갈 수 없습니다.

## 지도, 경로, 위치

차량 앱과 같은 지도·경로 서비스를 씁니다. API 키는 필요 없습니다.

| 기능 | 사용 | 파일 |
|---|---|---|
| 지도 | MapLibre GL + OpenFreeMap(`positron` 스타일) | `components/map/mapBase.ts` |
| 도로 경로 | OSRM 공개 데모 서버 | `lib/route.ts`, `hooks/useRoute.ts` |
| 현재 위치 | 브라우저 Geolocation | `lib/location.ts` |
| 초대 QR | `qrcode.react` (오류 정정 M) | `components/QrCode.tsx` |

- **지도는 필요할 때만 받습니다.** maplibre가 약 1MB라 `PlaceMap`, `RouteMap`은 `React.lazy`로 불러오고, 서비스 워커 precache에서도 뺐습니다(`vite.config.ts`의 `globIgnores`).
- **장소 고르기(`PlaceChooser`)**: 크루 장소 목록에서 고르거나, 지도에서 위치를 찍고 이름을 붙여 새 장소로 추가합니다. 크루 참여, 평소 탈 곳, 지점 변경, 출석에서 같이 씁니다.
- **경로**는 지점이 같으면 다시 부르지 않습니다(데모 서버 사용량 제한). 실패하면 지점끼리 직선으로 잇습니다. 데모 서버는 상용용이 아니므로 **실서비스 전에 서버 쪽 길찾기 API로 바꿔야 합니다.**
- **현재 위치**는 HTTPS나 `localhost`에서만 됩니다. 좌표는 서버에 맞춰 소수 6자리로 자릅니다.

## 서버와 맞춰야 하는 것

| 이 앱 | 서버 |
|---|---|
| `/join/:code` | `PAIRCAR_INVITE_BASE_URL` (초대 링크, QR) |
| `/trips/:tripId`, `/crews/:crewId/detours`, `/receipts/:receiptId` | 폰 알림을 누르면 여는 주소 (`PushMessages`) |
| `sw.ts`의 `PushPayload` | `WebPushSender`가 보내는 `{ type, title, body, url }` |

## API 호출

```ts
import { api, unwrap } from './api/client'

const me = await unwrap(api.GET('/api/members/me'))
```

- 경로, 요청, 응답 타입은 `schema.d.ts`에서 자동으로 맞춰집니다.
- `unwrap`은 `{ success, data, error }` 봉투를 벗겨 `data`만 돌려주고, 실패하면 `ApiError`(`code`, `message`, `status`)를 던집니다.
- 토큰(`localStorage`)이 있으면 `Authorization: Bearer` 헤더를 붙입니다.

## 폰 알림 (Web Push)

- `lib/push.ts`의 `enablePush()`를 버튼 클릭 안에서 부릅니다. 권한 요청 → 구독 → 서버 등록까지 합니다.
- HTTPS가 필요합니다. 개발 때는 `localhost`만 예외입니다.
- iOS는 16.4 이상에서, 홈 화면에 추가한 앱으로 열어야 받을 수 있습니다.
- 서버에 VAPID 키가 없으면 `enablePush()`가 `'disabled'`를 돌려줍니다.

## 배포

서버와 따로 배포합니다. `npm run build` 결과(`dist/`)는 정적 파일이라 정적 호스팅(Vercel, Netlify, Cloudflare Pages, S3 + CloudFront 등) 어디든 올릴 수 있습니다.

1. 빌드할 때 서버 주소를 넣습니다 (호스팅 환경변수 또는 `.env.production.local`). `.env.example` 참고

   ```
   VITE_API_BASE_URL=https://api.paircar.app
   ```

2. 서버 `infra/.env`에 웹 주소를 넣습니다

   ```
   PAIRCAR_CORS_ALLOWED_ORIGINS=https://app.paircar.app
   PAIRCAR_INVITE_BASE_URL=https://app.paircar.app/join
   ```

3. 호스팅에서 설정할 것
   - **SPA 폴백:** 없는 경로(`/join/ABCD2345`, `/trips/12`)는 `index.html`로 응답
   - **`sw.js`는 캐시하지 않음** (`Cache-Control: no-cache`). 캐시되면 새 버전이 늦게 퍼짐
   - **HTTPS 필수** (서비스 워커, 폰 알림, 현재 위치)
