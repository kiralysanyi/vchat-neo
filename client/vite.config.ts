import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), VitePWA({
    manifest: {
      name: "VChat-Neo",
      short_name: "VChat",
      start_url: "/",
      description: "VChat-Neo by kiralysanyi"
    }
  })],
})
