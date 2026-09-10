// Side-effect-only module: must be the FIRST import in server.ts. ES module imports are
// hoisted and evaluated in declaration order before any other top-level code runs, so a plain
// `loadEnv(...)` call placed after other imports would run too late — ./db and ./auth read
// process.env into module-scoped constants at their own top-level, before that call fires.
// Wrapping the call in its own module (like dotenv/config itself does) makes it participate
// in that same import-ordering guarantee.
import { config } from 'dotenv';

// Named .env.server (not .env) so Vite's client build never scans it — Vite auto-loads
// .env/.env.[mode] from the project root and would inline any VITE_-prefixed key straight
// into the browser bundle.
config({ path: '.env.server' });
