import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { oauthApiDevPlugin } from './vite.oauth-plugin'

export default defineConfig({
  plugins: [react(), tailwindcss(), oauthApiDevPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
