import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    allowedHosts: true,
    host: true,
    port: 3000,
    open: false,
    proxy: {
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true,
        rewriteWsOrigin: true
      }
    }
  },
  build: {
    target: 'esnext'
  }
});
