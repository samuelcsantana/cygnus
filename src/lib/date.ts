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

export function ageInMonths(birthDate: string): number {
  const birth = new Date(birthDate)
  const today = new Date()
  let months = (today.getFullYear() - birth.getFullYear()) * 12
  months += today.getMonth() - birth.getMonth()
  if (today.getDate() < birth.getDate()) {
    months -= 1
  }
  return Math.max(months, 0)
}
