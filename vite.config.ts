import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves this repo from /boardgame/, but Vercel (which builds
  // the same repo via its Git integration) serves dist/ from the domain
  // root. Vercel sets VERCEL=1 during every build, so pick the base
  // accordingly instead of hardcoding the GitHub Pages path for both targets.
  base: process.env.VERCEL ? '/' : '/boardgame/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
})
