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
      },
      // Needed since AuthClient (login/register/progression sync) fetches these as relative
      // paths from client code — unlike /api/grant-gold, which was always hit manually
      // (curl/browser) directly against :8080 and never went through the Vite dev server.
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  },
  build: {
    target: 'esnext'
  }
});
