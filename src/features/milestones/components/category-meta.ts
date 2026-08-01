import type { MilestoneCategory } from '../api/milestones.schemas'

interface CategoryMeta {
  emoji: string
  accentClass: string
  badgeClass: string
}

/**
 * Display-only mapping — the API has no icon/color field, only `category`.
 * See plan Section 4 ("Marcos") for the source table.
 */
export const MILESTONE_CATEGORY_META: Record<MilestoneCategory, CategoryMeta> = {
  MOTOR: {
    emoji: '🏃',
    accentClass: 'border-amber-100 group-hover:border-amber-400 group-hover:shadow-amber-400/20',
    badgeClass: 'bg-amber-50 text-amber-700',
  },
  LANGUAGE: {
    emoji: '🗣️',
    accentClass: 'border-indigo-100 group-hover:border-indigo-400 group-hover:shadow-indigo-400/20',
    badgeClass: 'bg-indigo-50 text-indigo-700',
  },
  SOCIAL: {
    emoji: '😊',
    accentClass: 'border-rose-100 group-hover:border-rose-400 group-hover:shadow-rose-400/20',
    badgeClass: 'bg-rose-50 text-rose-700',
  },
  COGNITIVE: {
    emoji: '🧠',
    accentClass: 'border-teal-100 group-hover:border-teal-400 group-hover:shadow-teal-400/20',
    badgeClass: 'bg-teal-50 text-teal-700',
  },
  OTHER: {
    emoji: '🌟',
    accentClass: 'border-slate-200 group-hover:border-slate-400 group-hover:shadow-slate-400/20',
    badgeClass: 'bg-slate-100 text-slate-700',
  },
}
