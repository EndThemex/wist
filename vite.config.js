import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    sourcemap: false,
    // 把常用依赖切成独立 chunk，提升缓存命中率 + 不阻塞首屏关键 JS
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          icons: ['lucide-react'],
          store: ['zustand'],
          idb: ['idb'],
        },
      },
    },
    // 缩减初始下载体积上限（warn only）
    chunkSizeWarningLimit: 600,
  },
  // 预构建大依赖，开发期也获得更快的冷启动
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'zustand', 'idb', 'lucide-react'],
  },
});
