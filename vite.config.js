import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// O frontend chama http://localhost:3001/api diretamente.
// Sem proxy — sem erros no terminal quando o backend não está rodando.
export default defineConfig({
  plugins: [react()],
})
