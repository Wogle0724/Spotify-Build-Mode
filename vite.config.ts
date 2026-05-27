import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `base: './'` keeps asset paths relative so the build works on GitHub Pages,
// Netlify, Vercel, or any static subpath without extra config.
export default defineConfig({
  plugins: [react()],
  base: './',
})
