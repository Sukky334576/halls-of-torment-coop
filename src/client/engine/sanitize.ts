/** Escapes HTML special characters so user-controlled text (room names, player names — neither
 * is restricted to a safe character set server-side, unlike account usernames) can be safely
 * interpolated into an innerHTML template string without letting a crafted name inject markup
 * or run script in every other player's browser who sees it. */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
