/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_ENDPOINT: string;
  readonly VITE_AICON_API_ENDPOINT: string;
  readonly VITE_CLIENT_ID: string;
  readonly VITE_CLIENT_SECRET: string;
  readonly VITE_AUTHEN_GRANT_TYPE: string;
  readonly VITE_REFRESH_GRANT_TYPE: string;
  readonly VITE_AICON_LOGIN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
