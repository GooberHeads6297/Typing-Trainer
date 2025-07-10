import { defineConfig } from 'vite'

export default defineConfig({
  base: '/Typing-Trainer/',
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: 'index.html'
    }
  }
})
