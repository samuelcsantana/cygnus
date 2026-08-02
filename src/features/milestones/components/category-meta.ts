import type { MilestoneCategory } from '../api/milestones.schemas'

interface CategoryMeta {
  emoji: string
  accentClass: string
  badgeClass: string
  solidClass: string
}

/**
 * Display-only mapping — the API has no icon/color field, only `category`.
 * Colors follow DESIGN.md's category table (not a 1:1 hue-per-category with
 * other features — e.g. MOTOR is teal here but vaccine "applied" is also
 * teal; that's intentional, matching the design reference exactly).
 */
export const MILESTONE_CATEGORY_META: Record<MilestoneCategory, CategoryMeta> = {
  MOTOR: {
    emoji: '🏃',
    accentClass: 'border-teal-100 group-hover:border-teal-400 group-hover:shadow-teal-400/20',
    badgeClass: 'bg-teal-50 text-teal-700',
    solidClass: 'bg-teal-700 text-white',
  },
  LANGUAGE: {
    emoji: '🗣️',
    accentClass: 'border-violet-100 group-hover:border-violet-400 group-hover:shadow-violet-400/20',
    badgeClass: 'bg-violet-50 text-violet-700',
    solidClass: 'bg-violet-700 text-white',
  },
  SOCIAL: {
    emoji: '😊',
    accentClass: 'border-amber-100 group-hover:border-amber-400 group-hover:shadow-amber-400/20',
    badgeClass: 'bg-amber-50 text-amber-700',
    solidClass: 'bg-amber-700 text-white',
  },
  COGNITIVE: {
    emoji: '🧠',
    accentClass: 'border-rose-100 group-hover:border-rose-400 group-hover:shadow-rose-400/20',
    badgeClass: 'bg-rose-50 text-rose-700',
    solidClass: 'bg-rose-700 text-white',
  },
  OTHER: {
    emoji: '🌟',
    accentClass: 'border-slate-200 group-hover:border-slate-400 group-hover:shadow-slate-400/20',
    badgeClass: 'bg-slate-100 text-slate-700',
    solidClass: 'bg-slate-600 text-white',
  },
}
