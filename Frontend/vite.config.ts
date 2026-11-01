import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Same-origin API in development: cookies stay first-party, no CORS juggling.
      '/api': 'http://localhost:4000',
      '/media': 'http://localhost:4000',
      // SEO endpoints are served by the backend at the site root.
      '/sitemap.xml': 'http://localhost:4000',
      '/robots.txt': 'http://localhost:4000',
      '/ads.txt': 'http://localhost:4000',
    },
  },
  build: {
    chunkSizeWarningLimit: 1200,
  },
})
