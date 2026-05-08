import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // リポジトリ名を / で囲んで指定します
  base: '/vocadash/', 
})