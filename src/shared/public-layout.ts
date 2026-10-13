/**
 * The column every public screen lays its header and sections out in: the landing page, and the
 * header of the sign-in screens.
 *
 * One string, not two copies that happen to match. The header's controls sit at this column's right
 * edge, and when the sign-in screens used a full-width header instead, the theme and language
 * buttons jumped 384px to the right on a 1920px screen (144px at 1440) and 14px down
 * the moment "Entrar" was clicked.
 */
export const PUBLIC_CONTAINER = 'mx-auto w-full max-w-6xl px-5 md:px-8'
