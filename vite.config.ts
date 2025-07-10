import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  base: 'https://github.com/GooberHeads6297/Typing-Trainer/', // <-- replace with your actual repo name if different
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: 'index.html'
    }
  }
})
