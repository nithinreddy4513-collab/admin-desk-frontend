import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-redirects',
      apply: 'build',
      generateBundle() {
        const redirectsContent = fs.readFileSync(path.resolve(__dirname, 'public/_redirects'), 'utf-8')
        this.emitFile({
          type: 'asset',
          fileName: '_redirects',
          source: redirectsContent
        })
      }
    }
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    historyApiFallback: true,
  },
})
