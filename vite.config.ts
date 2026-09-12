import { defineConfig } from 'vite';

export default defineConfig({
  // Baked into the client bundle as a literal — read by ClientTelemetry.ts so error_log rows
  // group by which deployed dist/assets/index-<hash>.js produced them. BUILD_VERSION lets a
  // deploy script pin this to something meaningful (a git SHA); otherwise it's just a build
  // timestamp, which still changes on every `npm run build` and is good enough to tell deploys
  // apart even without deploy-script wiring.
  define: {
    __BUILD_VERSION__: JSON.stringify(process.env.BUILD_VERSION || `dev-${Date.now()}`)
  },
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
      },
      // Mirrors the /admin/ location block added to the production nginx config (see
      // docs/archive/2026-09-11-telemetry-error-logging.md) — without it, /admin/telemetry falls
      // through to Vite's own SPA fallback here in dev the same way it silently fell through to
      // the game client on production before that nginx fix, making local testing of the
      // dashboard route through the real proxy impossible (only reachable via :8080 directly).
      '/admin': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  },
  build: {
    target: 'esnext'
  }
});
