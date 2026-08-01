import type { FieldError } from 'react-hook-form'

/**
 * Zod's built-in messages are always English. RHF's zodResolver sets
 * `error.type` to the underlying Zod issue code, so map that code to an
 * i18n key instead of rendering `error.message` directly.
 */
const ERROR_TYPE_KEYS: Record<string, string> = {
  too_small: 'validation.tooShort',
  too_big: 'validation.tooLong',
  invalid_string: 'validation.invalidFormat',
  invalid_format: 'validation.invalidFormat',
  invalid_type: 'validation.required',
  custom: 'validation.invalid',
}

export function fieldErrorKey(error: FieldError | undefined): string | null {
  if (!error) return null
  // Custom `.refine()` checks set `message` to an i18n key directly (by convention),
  // since there is no generic mapping for arbitrary business-rule validation.
  if (error.type === 'custom' && error.message) return error.message
  return ERROR_TYPE_KEYS[error.type] ?? 'validation.invalid'
}
