export function todayDateString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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
