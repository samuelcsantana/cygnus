/**
 * Weight and height cross the API as whole grams and whole millimetres, and are read by people as
 * kilograms and centimetres. This module is the only place that knows both.
 *
 * The API stores integers on purpose — these values are the raw material of a growth curve, and a
 * float that round-trips through JSON and arithmetic eventually prints 15.799999999999999. The
 * cost of that choice is exactly one conversion at each edge, and it is paid here so no component
 * multiplies by 1000 by hand.
 */

/**
 * What the API accepts: 100 g to 150 kg, and 10 cm to 250 cm. Wider than any child could be, and
 * narrow only enough to catch a mistyped extra digit — a health record that refuses a real
 * measurement is worse than one that stores an odd-looking value.
 */
export const WEIGHT_KG_MIN = 0.1
export const WEIGHT_KG_MAX = 150
export const HEIGHT_CM_MIN = 10
export const HEIGHT_CM_MAX = 250

/**
 * Parses what someone typed, accepting a comma as the decimal separator.
 *
 * The field is a text input rather than `type="number"` precisely for this: a Brazilian keyboard's
 * numeric pad offers a comma, and `type="number"` discards the value silently when it sees one —
 * the person watches their weight vanish on blur with no error to explain it.
 *
 * Returns `null` for blank (the field was left empty, which is a valid answer) and `NaN` for
 * something that is not a number, so a caller can tell "nothing" from "wrong".
 */
export function parseDecimalInput(value: string | undefined): number | null {
  const trimmed = value?.trim()

  if (!trimmed) {
    return null
  }

  return Number(trimmed.replace(',', '.'))
}

export function kilogramsInputToGrams(value: string | undefined): number | null {
  const kilograms = parseDecimalInput(value)
  return kilograms === null || !Number.isFinite(kilograms) ? null : Math.round(kilograms * 1000)
}

export function centimetersInputToMillimeters(value: string | undefined): number | null {
  const centimeters = parseDecimalInput(value)
  return centimeters === null || !Number.isFinite(centimeters) ? null : Math.round(centimeters * 10)
}

/** For a form field, so it uses a dot — an `<input>` value is not locale-formatted text. */
export function gramsToKilogramsInput(grams: number | null): string {
  return grams === null ? '' : String(grams / 1000)
}

export function millimetersToCentimetersInput(millimeters: number | null): string {
  return millimeters === null ? '' : String(millimeters / 10)
}

/** For display, where it is prose and follows the reader's locale: "15,8 kg" in pt-BR. */
export function formatKilograms(grams: number, language: string): string {
  return `${new Intl.NumberFormat(language, { maximumFractionDigits: 3 }).format(grams / 1000)} kg`
}

export function formatCentimeters(millimeters: number, language: string): string {
  return `${new Intl.NumberFormat(language, { maximumFractionDigits: 1 }).format(millimeters / 10)} cm`
}
