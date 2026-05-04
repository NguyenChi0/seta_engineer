import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  // Tránh 2 bản React (hooks lỗi) khi react-quill được pre-bundle khác đường với app
  resolve: {
    dedupe: ['react', 'react-dom', 'quill'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://seta-eng.co.jp/',
        changeOrigin: true,
      },
    },
  },
})
