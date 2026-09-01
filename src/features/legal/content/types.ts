/**
 * The shape a legal document takes on disk.
 *
 * Prose lives here rather than in `src/locales/*.json` on purpose. Three
 * reasons, in order of weight:
 *
 * 1. **Substitution has to be one operation.** When the reviewed text arrives,
 *    the whole job is: replace the `sections` array in one file, bump `version`
 *    in `shared/legal.ts`, set `effectiveFrom`, and flip `status` to
 *    `'in-force'`. Nothing else in the app has to be touched.
 * 2. A legal document is content, not UI copy. The locale files carry labels
 *    and messages; a policy is a versioned artefact whose wording is the thing
 *    being agreed to.
 * 3. Three "equivalent" translations of a binding document would be a lie. This
 *    app serves Brazil and the document is governed by Brazilian law, so the
 *    Portuguese text is the one that binds — see `BINDING_LOCALE`.
 */

export interface LegalSection {
  /** Stable across wording changes: it is what an anchor link would point at. */
  id: string
  heading: string
  /** One string per paragraph. Rendered as-is; no markup is interpreted. */
  body: string[]
  /**
   * Marks a section whose content a human must supply before the document can
   * leave `draft`. Rendered with a visible warning, so a half-finished policy
   * cannot quietly look finished.
   */
  needsReview?: boolean
}

export interface LegalContent {
  locale: string
  sections: LegalSection[]
}

/**
 * The document binds in this language. Other locales get the same text with a
 * notice, rather than a translation that would have to be reviewed separately
 * to mean anything.
 */
export const BINDING_LOCALE = 'pt-BR'
