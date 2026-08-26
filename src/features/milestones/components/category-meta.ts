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
 * other features — e.g. MOTOR is the brand green here and vaccine "applied" is
 * the same green; that's intentional, matching the design reference exactly).
 */
export const MILESTONE_CATEGORY_META: Record<MilestoneCategory, CategoryMeta> = {
  MOTOR: {
    emoji: '🏃',
    nodeClass: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-600',
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
    solidClass: 'bg-emerald-700 text-white',
  },
  LANGUAGE: {
    emoji: '🗣️',
    nodeClass: 'bg-violet-50 dark:bg-violet-950/40 border-violet-500',
    badgeClass: 'bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300',
    solidClass: 'bg-violet-700 text-white',
  },
  SOCIAL: {
    emoji: '😊',
    nodeClass: 'bg-amber-50 dark:bg-amber-950/40 border-amber-500',
    badgeClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
    solidClass: 'bg-amber-700 text-white',
  },
  COGNITIVE: {
    emoji: '🧠',
    nodeClass: 'bg-rose-50 dark:bg-rose-950/40 border-rose-500',
    badgeClass: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300',
    solidClass: 'bg-rose-700 text-white',
  },
  OTHER: {
    emoji: '🌟',
    nodeClass: 'bg-slate-100 border-slate-400',
    badgeClass: 'bg-slate-100 text-slate-700',
    solidClass: 'bg-slate-600 text-white',
  },
}
