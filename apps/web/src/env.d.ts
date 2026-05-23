/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_GOOGLE_LOGIN_URL: string;
  readonly VITE_SEAT_HOLD_DURATION_SECONDS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
