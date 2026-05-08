import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHubのリポジトリ名を指定（スラッシュで囲むのを忘れずに！）
  base: '/vocadash/', 
})