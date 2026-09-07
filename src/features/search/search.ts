import type { Appointment } from '@/features/appointments/api/appointments.schemas'
import type { Baby } from '@/features/babies/api/babies.schemas'
import type { Medication } from '@/features/medications/api/medications.schemas'
import type { Milestone } from '@/features/milestones/api/milestones.schemas'
import type { Specialist } from '@/features/specialists/api/specialists.schemas'
import type { VaccineItem } from '@/features/vaccines/api/vaccines.schemas'

export type SearchDomain = 'babies' | 'vaccines' | 'appointments' | 'medications' | 'milestones' | 'specialists'

export interface SearchResult {
  /** Unique across domains — two features can hold the same row id. */
  key: string
  domain: SearchDomain
  title: string
  /** Who and when, when there is a who and a when. */
  subtitle: string | null
  to: string
}

/**
 * Two characters. One letter matches most of the database and answers nothing,
 * and the list flashing on every keystroke of a word being typed is worse than
 * no list.
 */
export const MIN_QUERY_LENGTH = 2

/**
 * Casefolded and stripped of accents.
 *
 * Not a nicety in pt-BR: "varicela" has to find "Varicela", "sarampo" has to
 * find "Sarampão", and a parent typing on a phone keyboard in a hurry does not
 * hold the accent key down. Both sides go through here, so the comparison is
 * symmetric — normalising only the query is the version that silently fails on
 * the data's own accents.
 */
export function normalise(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

/** True when any of the fields contains the query. Nulls are fields nobody filled in. */
export function matches(fields: readonly (string | null | undefined)[], query: string): boolean {
  const needle = normalise(query)
  if (needle.length < MIN_QUERY_LENGTH) return false

  return fields.some((field) => !!field && normalise(field).includes(needle))
}

interface SearchInput {
  query: string
  babies: readonly Baby[]
  vaccines: readonly { baby: Baby; items: readonly VaccineItem[] }[]
  appointments: readonly { baby: Baby; items: readonly Appointment[] }[]
  medications: readonly { baby: Baby; items: readonly Medication[] }[]
  milestones: readonly { baby: Baby; items: readonly Milestone[] }[]
  specialists: readonly Specialist[]
}

/**
 * Everything this account can see that matches, grouped by where it lives.
 *
 * **It searches what is already loaded and nothing else** — there is no search
 * endpoint, and adding one would be a second implementation of every domain's
 * visibility rules, which is the class of bug that leaks another family's data.
 * The dialog mounts the aggregate hooks the pages already use, so a result can
 * only be something the reader could have reached by walking the app.
 *
 * The order of the domains is the order of the menu, not relevance ranking. A
 * parent searching "amoxicilina" knows whether they are after a prescription or
 * an appointment note; what they cannot do is guess which of six lists a
 * scoring function decided to put first today.
 */
export function search(input: SearchInput): SearchResult[] {
  const { query } = input
  if (normalise(query).length < MIN_QUERY_LENGTH) return []

  const results: SearchResult[] = []

  for (const baby of input.babies) {
    if (matches([baby.name, baby.healthPlanName, baby.healthPlanNumber, ...baby.allergies], query)) {
      results.push({ key: `baby:${baby.id}`, domain: 'babies', title: baby.name, subtitle: null, to: '/dashboard' })
    }
  }

  for (const { baby, items } of input.vaccines) {
    for (const item of items) {
      // `description` and `guidance` are the catalogue's own prose — long, and
      // the reason "hepatite" finds a dose whose name says only "Penta".
      if (matches([item.name, item.description, item.guidance, item.location, item.professional, item.notes], query)) {
        results.push({
          key: `vaccine:${baby.id}:${item.vaccineId}:${item.doseNumber}`,
          domain: 'vaccines',
          title: item.name,
          subtitle: baby.name,
          to: '/vaccines',
        })
      }
    }
  }

  for (const { baby, items } of input.appointments) {
    for (const item of items) {
      if (matches([item.doctorName, item.specialty, item.location, item.reason, item.notes], query)) {
        results.push({
          key: `appointment:${item.id}`,
          domain: 'appointments',
          title: item.doctorName,
          subtitle: [baby.name, item.specialty].filter(Boolean).join(' · '),
          to: '/appointments',
        })
      }
    }
  }

  for (const { baby, items } of input.medications) {
    for (const item of items) {
      if (matches([item.name, item.dosage, item.frequency, item.reason, item.prescriberName, item.notes], query)) {
        results.push({
          key: `medication:${item.id}`,
          domain: 'medications',
          title: item.name,
          subtitle: [baby.name, item.dosage].filter(Boolean).join(' · '),
          to: '/medications',
        })
      }
    }
  }

  for (const { baby, items } of input.milestones) {
    for (const item of items) {
      if (matches([item.title, item.description], query)) {
        results.push({
          key: `milestone:${item.id}`,
          domain: 'milestones',
          title: item.title,
          subtitle: baby.name,
          to: '/milestones',
        })
      }
    }
  }

  for (const specialist of input.specialists) {
    if (matches([specialist.name, specialist.specialty, specialist.phone], query)) {
      results.push({
        key: `specialist:${specialist.id}`,
        domain: 'specialists',
        title: specialist.name,
        subtitle: specialist.specialty,
        to: '/profissionais',
      })
    }
  }

  return results
}

/** The results of one domain, in the menu's order, for a list with headings. */
export function groupByDomain(results: readonly SearchResult[]): { domain: SearchDomain; results: SearchResult[] }[] {
  const order: SearchDomain[] = ['babies', 'vaccines', 'appointments', 'specialists', 'medications', 'milestones']

  return order
    .map((domain) => ({ domain, results: results.filter((result) => result.domain === domain) }))
    .filter((group) => group.results.length > 0)
}
