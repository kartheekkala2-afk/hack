import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        donor: './donor-dashboard.html',
        restaurant: './restaurant-dashboard.html',
        volunteer: './volunteer-dashboard.html',
        public: './dashboard.html'
      }
    }
  }
})
