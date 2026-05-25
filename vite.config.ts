import { defineConfig } from 'vite';

export default defineConfig({
  // 加载 .env 文件
  envDir: './',
  envPrefix: 'VITE_',
});
