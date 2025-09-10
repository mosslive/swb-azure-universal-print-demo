/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AZURE_CLIENT_ID: string
  readonly VITE_AZURE_TENANT_ID: string
  readonly VITE_AZURE_SCOPE: string
  readonly VITE_BACKEND_URL: string
  readonly VITE_REDIRECT_URI: string
}