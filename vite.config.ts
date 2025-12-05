import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    server: {
      host: true, // 允许外部访问
      port: 5174, // 固定端口，避免每次重启都变化
      cors: true, // 允许跨域请求
      allowedHosts: [
        'localhost',
        '127.0.0.1',
        'wiki.bujiland.cloud' // 允许wiki.bujiland.cloud域名访问
      ],
      proxy: {
        // 将所有/api请求代理到后端服务器
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false
        }
      }
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || process.env.API_KEY)
    }
  }
})