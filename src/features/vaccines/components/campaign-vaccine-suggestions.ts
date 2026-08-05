// Same 8 suggestions as the reference prototype — plain suggestions to
// pre-fill the free-text campaign name, not a backend-managed catalog, so
// no i18n keys (mirrors item.description already coming raw from the API
// elsewhere in this feature).
export const CAMPAIGN_VACCINE_SUGGESTIONS = [
  'Influenza (gripe) — Campanha anual',
  'COVID-19 — Dose adicional',
  'Febre Amarela — Reforço',
  'Meningocócica ACWY — Adolescentes',
  'HPV — Campanha escolar',
  'Hepatite A — Campanha',
  'Sarampo (MMR) — Campanha',
  'Poliomielite — Campanha nacional',
] as const
