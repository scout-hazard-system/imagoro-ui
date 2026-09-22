/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_IMAGORO_MCP_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}