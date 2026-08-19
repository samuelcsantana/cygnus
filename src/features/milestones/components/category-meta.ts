import type { MilestoneCategory } from '../api/milestones.schemas'

interface CategoryMeta {
  emoji: string
  nodeClass: string
  badgeClass: string
  solidClass: string
}

/**
 * Display-only mapping — the API has no icon/color field, only `category`.
 * Colors follow the committed design reference's category table (not a 1:1 hue-per-category with
 * other features — e.g. MOTOR is teal here but vaccine "applied" is also
 * teal; that's intentional, matching the design reference exactly).
 */
export const MILESTONE_CATEGORY_META: Record<MilestoneCategory, CategoryMeta> = {
  MOTOR: {
    emoji: '🏃',
    nodeClass: 'bg-teal-50 border-teal-500',
    badgeClass: 'bg-teal-50 text-teal-700',
    solidClass: 'bg-teal-700 text-white',
  },
  LANGUAGE: {
    emoji: '🗣️',
    nodeClass: 'bg-violet-50 border-violet-500',
    badgeClass: 'bg-violet-50 text-violet-700',
    solidClass: 'bg-violet-700 text-white',
  },
  SOCIAL: {
    emoji: '😊',
    nodeClass: 'bg-amber-50 border-amber-500',
    badgeClass: 'bg-amber-50 text-amber-700',
    solidClass: 'bg-amber-700 text-white',
  },
  COGNITIVE: {
    emoji: '🧠',
    nodeClass: 'bg-rose-50 border-rose-500',
    badgeClass: 'bg-rose-50 text-rose-700',
    solidClass: 'bg-rose-700 text-white',
  },
  OTHER: {
    emoji: '🌟',
    nodeClass: 'bg-slate-100 border-slate-400',
    badgeClass: 'bg-slate-100 text-slate-700',
    solidClass: 'bg-slate-600 text-white',
  },
}
