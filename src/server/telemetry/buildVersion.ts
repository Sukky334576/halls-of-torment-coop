// Set by the deploy script (e.g. to a git SHA or a timestamp) so error_log/game_events rows can
// be correlated to the exact server code that produced them across redeploys. Falls back to
// 'dev' for local runs where nothing sets it — every row just gets that same value then, which
// is fine (there's nothing to correlate across deploys locally anyway).
export const SERVER_BUILD_VERSION = process.env.BUILD_VERSION || 'dev';
