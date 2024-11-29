import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: './',
  base: '/numbers-home/',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  },
  server: {
    host: true,
    port: 3000,
    open: true,
    cors: true,
    strictPort: true,
    hmr: {
      overlay: false
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
})
