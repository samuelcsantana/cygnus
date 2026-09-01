import type { MilestoneCategory } from '../api/milestones.schemas'

export interface MilestoneSuggestion {
  /** i18n key for the example title. The stored milestone gets the resolved text. */
  titleKey: string
  category: MilestoneCategory
}

/**
 * Examples offered when a family has not recorded any milestone yet.
 *
 * **Deliberately not anchored to an age, and that is the whole design.** The
 * obvious version of this feature — "at 2 months babies usually smile, hold
 * their head up, follow objects" — turns the screen into a checklist a parent
 * measures their child against, and a child who is not doing those things by
 * that month makes the app the bearer of a worry it is not qualified to raise.
 * This app is explicit that it does not give clinical guidance; suggesting a
 * developmental timetable would be exactly that, in the friendliest possible
 * voice.
 *
 * So these are examples of **what other families write down**, not of what a
 * child should be doing. One per category, so the four categories become
 * legible through instances rather than through an abstract label — which is
 * also why they are here and not in the empty-state copy: tapping one opens the
 * form already filled, so the example is a starting point rather than a
 * suggestion to read and dismiss.
 */
export const MILESTONE_SUGGESTIONS: MilestoneSuggestion[] = [
  { titleKey: 'milestones.suggestions.firstSmile', category: 'SOCIAL' },
  { titleKey: 'milestones.suggestions.rolledOver', category: 'MOTOR' },
  { titleKey: 'milestones.suggestions.firstWord', category: 'LANGUAGE' },
  { titleKey: 'milestones.suggestions.recognisedName', category: 'COGNITIVE' },
]
