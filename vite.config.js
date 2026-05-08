import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/vocadash/', // ← これを追加！（スラッシュで囲むのを忘れずに）
})