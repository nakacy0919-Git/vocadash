import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { wordImageIndex } from './tools/word-image-index.mjs'

export default defineConfig({
  plugins: [react()],
  define: { __VOCADASH_WORD_IMAGES__: JSON.stringify(wordImageIndex()) },
  server: {proxy: {'/api/classroom': 'http://127.0.0.1:8787'}},
  // ▼ ここを '/' に戻す
  base: '/', 
})