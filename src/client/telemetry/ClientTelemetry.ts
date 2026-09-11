import type { ErrorCategory, ClientErrorReportPayload } from '../../shared/telemetryTypes';

// Baked in at build time by vite.config.ts's `define` — changes on every `npm run build`, so
// error_log rows naturally group by which deployed dist/assets/index-<hash>.js produced them.
declare const __BUILD_VERSION__: string;

const FLUSH_INTERVAL_MS = 3000;
// Matches the server's own per-request cap (see server.ts's MAX_TELEMETRY_BATCH) — no point
// buffering more client-side than a single POST could ever deliver anyway.
const MAX_PENDING_ERRORS = 50;

let pending: ClientErrorReportPayload[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;

function getClientInfo(): Record<string, unknown> {
  // Whitelisted to browser/OS/screen only — see the telemetry spec's guard against ever sending
  // IP or a device fingerprint from here.
  return {
    browser: navigator.userAgent,
    os: navigator.platform,
    screen: `${window.screen.width}x${window.screen.height}`
  };
}

function report(category: ErrorCategory, message: string, stackTrace?: string, context?: Record<string, unknown>): void {
  if (pending.length >= MAX_PENDING_ERRORS) return;
  pending.push({
    category,
    message: (message || 'Unknown error').slice(0, 2000),
    stackTrace: stackTrace?.slice(0, 4000),
    context,
    clientInfo: getClientInfo(),
    buildVersion: typeof __BUILD_VERSION__ !== 'undefined' ? __BUILD_VERSION__ : 'unknown'
  });
}

async function flush(): Promise<void> {
  if (pending.length === 0) return;
  const batch = pending.splice(0, MAX_PENDING_ERRORS);
  try {
    await fetch('/api/telemetry/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ errors: batch })
    });
  } catch {
    // Best-effort only, like the rest of this module — telemetry must never affect gameplay.
    // Dropped rather than requeued, so a sustained server outage can't grow this into an
    // unbounded retry backlog sitting in memory for the whole session.
  }
}

/** Client-side error capture — buffers locally, batches a POST to /api/telemetry/errors every
 * few seconds. See docs/GAME_WIKI.md's telemetry section for the full category list and how
 * this correlates with the server's own error_log entries (same table, source='client' vs
 * 'server'). */
export const ClientTelemetry = {
  init(): void {
    if (flushTimer) return; // Already initialized — main.ts only calls this once, but be safe.

    window.addEventListener('error', (event) => {
      report('js_exception', event.message, event.error?.stack, {
        filename: event.filename,
        line: event.lineno,
        col: event.colno
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      const message = reason instanceof Error ? reason.message : String(reason);
      const stack = reason instanceof Error ? reason.stack : undefined;
      report('promise_rejection', message, stack);
    });

    flushTimer = setInterval(() => {
      void flush();
    }, FLUSH_INTERVAL_MS);
  },

  reportRenderError(err: unknown): void {
    const e = err instanceof Error ? err : new Error(String(err));
    report('render_error', e.message, e.stack);
  },

  reportWsDisconnect(detail: string): void {
    report('ws_disconnect', detail);
  },

  reportWsReconnect(attemptsTaken: number): void {
    report('ws_reconnect', `reconnected after ${attemptsTaken} attempt(s)`);
  }
};
