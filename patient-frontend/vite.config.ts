import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      host: env.HOST || '0.0.0.0',
      port: Number(env.PORT || 3000),
      proxy: {
        '/graphql': env.VITE_BACKEND_URL || 'http://localhost:4000',
        '/auth': env.VITE_BACKEND_URL || 'http://localhost:4000',
      },
    },
  }
})
