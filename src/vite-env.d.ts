/// <reference types="vite/client" />

interface ImportMetaEnv {
  // 서버 주소 (예: https://api.paircar.app). 비우면 같은 출처의 /api를 부름 (개발 때 Vite 프록시)
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
