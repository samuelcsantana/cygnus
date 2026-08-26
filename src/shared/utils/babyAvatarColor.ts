const PALETTE = [
  { bg: 'bg-emerald-600', text: 'text-white' },
  { bg: 'bg-amber-500', text: 'text-white' },
  { bg: 'bg-rose-500', text: 'text-white' },
  { bg: 'bg-violet-500', text: 'text-white' },
] as const

/**
 * Deterministic fallback for babies without a user-chosen `avatarColor` (e.g.
 * created before that field existed), so the same baby still always gets the
 * same color across renders/sessions.
 */
export function babyAvatarPalette(babyId: string): { bg: string; text: string } {
  let hash = 0
  for (let i = 0; i < babyId.length; i++) {
    hash = (hash * 31 + babyId.charCodeAt(i)) >>> 0
  }
  return PALETTE[hash % PALETTE.length]!
}

export interface BabyAvatarAppearance {
  className: string
  style?: { backgroundColor: string }
}

// Prefers the color the user picked for the baby's avatar; falls back to the
// id-derived palette only when no avatarColor is set.
export function babyAvatarAppearance(babyId: string, avatarColor: string | null | undefined): BabyAvatarAppearance {
  if (avatarColor) {
    return { className: 'text-white', style: { backgroundColor: avatarColor } }
  }
  const palette = babyAvatarPalette(babyId)
  return { className: `${palette.bg} ${palette.text}` }
}

export function babyInitials(name: string): string {
  return name.trim().slice(0, 1).toUpperCase()
}
