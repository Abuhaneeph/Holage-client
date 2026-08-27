import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  optimizeDeps: {
    include: ['react-map-gl', 'mapbox-gl'],
    exclude: []
  },
  define: {
    'process.env': {}
  },
  server: {
    fs: {
      strict: false
    }
  },
  // Defense in depth: drop console/debugger calls from the production bundle so any
  // console.log left behind (auth headers, API responses, PII) never ships to the browser.
  esbuild: {
    drop: command === 'build' ? ['console', 'debugger'] : []
  }
}))
