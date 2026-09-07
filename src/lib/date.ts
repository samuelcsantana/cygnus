export function toDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayDateString(): string {
  return toDateString(new Date())
}

export function parseDateString(dateStr: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr)
  if (!match) return undefined
  const [, year, month, day] = match
  return new Date(Number(year), Number(month) - 1, Number(day))
}

/** Displays a `yyyy-MM-dd` value in the Brazilian `dd-MM-yyyy` standard. */
export function formatBrDateString(dateStr: string): string {
  const date = parseDateString(dateStr)
  if (!date) return ''
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${day}-${month}-${date.getFullYear()}`
}

/** Parses a `dd-MM-yyyy` value (the Brazilian standard), rejecting calendar-invalid dates like 31-04-2024. */
export function parseBrDateString(dateStr: string): Date | undefined {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(dateStr)
  if (!match) return undefined
  const [, day, month, year] = match
  const date = new Date(Number(year), Number(month) - 1, Number(day))
  const isRealDate =
    date.getFullYear() === Number(year) && date.getMonth() === Number(month) - 1 && date.getDate() === Number(day)
  return isRealDate ? date : undefined
}

export function formatDateDisplay(dateStr: string, locale: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year!, (month ?? 1) - 1, day)
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
}

/**
 * O dia e o mês abreviado, separados, para o bloco de data das consultas.
 *
 * Separados de propósito: o dia é impresso grande e em mono e o mês pequeno
 * embaixo, então não existe uma string única que sirva. Montar isso no
 * componente com `slice` sobre `formatDateDisplay` funcionaria em pt-BR e
 * quebraria em `en`, onde o mês vem antes do dia — daí o `Intl` decidir os dois
 * pedaços, cada um no seu formato.
 *
 * O mês volta sem o ponto que o pt-BR acrescenta ("set." → "set"): o glifo é
 * ruído numa caixa de 10px que já é só rótulo, e alinhá-lo sob o dia com o
 * ponto deslocava o texto meio caractere para a esquerda.
 */
export function formatDayMonthParts(dateStr: string, locale: string): { day: string; month: string } {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year!, (month ?? 1) - 1, day)
  return {
    day: new Intl.DateTimeFormat(locale, { day: '2-digit' }).format(date),
    month: new Intl.DateTimeFormat(locale, { month: 'short' }).format(date).replace(/\.$/, ''),
  }
}

export function formatDateTimeDisplay(isoString: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoString))
}

export function nowLocalDateTimeString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function splitScheduledAt(scheduledAt: string): { date: string; time: string } {
  const dt = new Date(scheduledAt)
  const year = dt.getFullYear()
  const month = String(dt.getMonth() + 1).padStart(2, '0')
  const day = String(dt.getDate()).padStart(2, '0')
  const hours = String(dt.getHours()).padStart(2, '0')
  const minutes = String(dt.getMinutes()).padStart(2, '0')
  return { date: `${year}-${month}-${day}`, time: `${hours}:${minutes}` }
}

/**
 * A `yyyy-MM-dd` from the API read as the calendar date it is, at local midnight.
 *
 * `new Date('2024-01-01')` is parsed as **UTC** midnight, and every reader here
 * asks for local components: in any negative offset — all of Brazil — that Date
 * answers `getDate() === 31` for the 1st. Ages were coming out a day early every
 * month because of it, and the error is invisible except on the day it flips.
 *
 * Falls back to the plain parse so a full ISO instant (which this app does not
 * store as a birth date, but might be handed one day) still returns something.
 */
function calendarDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (!match) return new Date(value)
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

/**
 * Completed months between a birth date and a moment — the way a parent counts:
 * a child is "2 months" from the day after the second monthiversary until the
 * third, and never "2.7 months".
 */
export function ageInMonthsAt(birthDate: string, at: Date): number {
  const birth = calendarDate(birthDate)
  let months = (at.getFullYear() - birth.getFullYear()) * 12
  months += at.getMonth() - birth.getMonth()
  if (at.getDate() < birth.getDate()) {
    months -= 1
  }
  return Math.max(months, 0)
}

export function ageInMonths(birthDate: string): number {
  return ageInMonthsAt(birthDate, new Date())
}

/**
 * Age in months as a real number, for plotting a point on an axis.
 *
 * Whole months are right for reading ("2 meses") and wrong for placing: two
 * visits three weeks apart in a newborn's first month both land on 0 and the
 * curve draws a vertical line, which is the age when a growth curve is steepest
 * and most worth looking at. Days over 30.4375 (365.25 / 12) keeps them apart.
 *
 * The two functions disagree by design, and by less than a month: this one is
 * the x coordinate, `ageInMonthsAt` is the label.
 */
export function ageInMonthsExactAt(birthDate: string, at: Date): number {
  const birth = calendarDate(birthDate)
  const days = (at.getTime() - birth.getTime()) / 86_400_000
  return Math.max(days / 30.4375, 0)
}
