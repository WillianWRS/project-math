/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_SHOW_GOD_MODE_TOGGLE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
