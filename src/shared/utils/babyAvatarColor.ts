const PALETTE = [
  { bg: 'bg-teal-500', text: 'text-white' },
  { bg: 'bg-amber-500', text: 'text-white' },
  { bg: 'bg-rose-500', text: 'text-white' },
  { bg: 'bg-violet-500', text: 'text-white' },
] as const

/**
 * The design reference assigns each baby a fixed color for its
 * initials-avatar circle rather than a photo — there's no `color` field on
 * the API's Baby, so it's derived deterministically from the id so the
 * same baby always gets the same color across renders/sessions.
 */
export function babyAvatarPalette(babyId: string): { bg: string; text: string } {
  let hash = 0
  for (let i = 0; i < babyId.length; i++) {
    hash = (hash * 31 + babyId.charCodeAt(i)) >>> 0
  }
  return PALETTE[hash % PALETTE.length]!
}

export function babyInitials(name: string): string {
  return name.trim().slice(0, 1).toUpperCase()
}
