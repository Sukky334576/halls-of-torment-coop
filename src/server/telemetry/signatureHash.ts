import { createHash } from 'crypto';
import type { ErrorSource } from '../../shared/telemetryTypes';

/** Collapses an error message's run-specific noise (uuids, player/device ids, raw numbers) so
 * "the same bug" reported with different ids/coordinates/damage values still hashes identically
 * — otherwise every occurrence would look like a brand-new signature and error_log's dedup/
 * occurrence_count tracking would never actually dedupe anything. */
function normalizeMessage(rawMessage: string): string {
  return rawMessage
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '<uuid>')
    .replace(/\b(p_|dev_)[a-z0-9_]+\b/gi, '<player_id>')
    .replace(/\b\d+\b/g, '<n>')
    .trim();
}

/** `topFrame` is server-only (client stack traces are minified/hashed per-deploy — see
 * ClientTelemetry — so pinning a client signature to a specific minified frame would make it
 * change on every single deploy, defeating the whole point of deduping across deploys). */
export function computeSignatureHash(
  source: ErrorSource,
  category: string,
  rawMessage: string,
  topFrame?: string
): string {
  const normalized = normalizeMessage(rawMessage);
  const hash = createHash('sha1');
  hash.update(
    source === 'client' ? `${source}|${category}|${normalized}` : `${source}|${category}|${normalized}|${topFrame ?? ''}`
  );
  return hash.digest('hex');
}
