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
   - **HTTPS 필수** (서비스 워커, 폰 알림)
# paircar-mobile
