import { createAvatar } from '@dicebear/core'
import { avataaars } from '@dicebear/collection'

/**
 * Generated locally (no network call) so the app never depends on
 * api.dicebear.com being reachable — the SVG is built from the same
 * "avataaars" style, deterministically seeded by name, and inlined as a
 * data URI.
 */
export function defaultAvatarDataUri(seed: string): string {
  return createAvatar(avataaars, { seed }).toDataUri()
}
