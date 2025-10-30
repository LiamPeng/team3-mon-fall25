import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

const isProduction = process.env.NODE_ENV === 'production'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // production or development
  base: isProduction ? '/static/' : '/',
  
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    // Output dir：Put build files into ../backend/static
    outDir: path.resolve(__dirname, "../backend/frontend_build"),
    emptyOutDir: true, // Empty before build
  },
})