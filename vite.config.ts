import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Production (GitHub Pages) uses the repo name as the path; local dev uses root.
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/ux-portfolio-2026/' : '/',
  plugins: [react()],
})
