import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Set via .env.server on a real deploy (see server.ts's first import, ./loadEnv). Falls back
// to a fixed dev secret so local `npm run server` keeps working with zero setup; that fallback
// is only safe because it never leaves this process — no committed default is ever a real secret.
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-set-JWT_SECRET-before-deploying';
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET not set — using an insecure development default. Set it before deploying.');
}

const TOKEN_TTL = '30d'; // Long-lived on purpose: a casual co-op game, not a banking app.
const BCRYPT_ROUNDS = 10;

export const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
export const MIN_PASSWORD_LENGTH = 6;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

const JWT_ALGORITHM = 'HS256';

export function signToken(userId: number): string {
  return jwt.sign({ uid: userId }, JWT_SECRET, { expiresIn: TOKEN_TTL, algorithm: JWT_ALGORITHM });
}

export function verifyToken(token: string): { uid: number } | null {
  try {
    // Pin the algorithm explicitly rather than trusting the token's own `alg` header — jwt.sign
    // above only ever produces HS256, so there's no legitimate reason to accept anything else.
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITHM] });
    if (typeof payload === 'object' && typeof payload.uid === 'number') {
      return { uid: payload.uid };
    }
    return null;
  } catch {
    return null;
  }
}

// Minimal brute-force throttle for /api/login — an in-memory map is fine here (single
// process, no clustering — see server.ts), and resets naturally on a restart/deploy.
const LOGIN_ATTEMPT_WINDOW_MS = 60_000;
const MAX_ATTEMPTS_PER_WINDOW = 8;
const loginAttempts = new Map<string, number[]>();

/** Keyed by a caller-supplied identifier (IP is fine) — not the username, so this can't be
 * used to lock a real user out by hammering login attempts with their name from elsewhere. */
export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const attempts = (loginAttempts.get(key) || []).filter((t) => now - t < LOGIN_ATTEMPT_WINDOW_MS);
  attempts.push(now);
  loginAttempts.set(key, attempts);
  return attempts.length > MAX_ATTEMPTS_PER_WINDOW;
}
