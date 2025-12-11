import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// https://vitejs.dev/config/
export default defineConfig({
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
  }
})
