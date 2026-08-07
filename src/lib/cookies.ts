/**
 * Reads a single cookie by name from `document.cookie`. Only useful for
 * cookies that are NOT HttpOnly (e.g. the CSRF double-submit cookie) —
 * `access_token`/`refresh_token` are HttpOnly and never visible to JS, by
 * design (see CLAUDE.md Section 6).
 */
export function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]!) : null
}
