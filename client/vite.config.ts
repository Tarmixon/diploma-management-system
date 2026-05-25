import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // --- ДОДАЙТЕ ЦЕЙ БЛОК ---
  optimizeDeps: {
    include: ['recharts', 'lodash']
  }
  // -----------------------
})