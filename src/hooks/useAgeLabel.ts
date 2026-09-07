import { useTranslation } from 'react-i18next'

import { ageInMonths } from '@/lib/date'

/**
 * How old a child is, the way a parent answers the question.
 *
 * The app said "66 meses" for a five-year-old everywhere an age appeared. That
 * was tolerable while ages lived inside a card someone had already opened; it is
 * not tolerable in a menu that lists the children side by side, where it is the
 * only thing distinguishing two names.
 *
 * The cut is at two years, which is where people themselves stop counting in
 * months. Under it, months are what a parent uses ("3 meses"); over it, nobody
 * says "vinte e nove meses". The months are dropped when they are zero, so a
 * birthday reads "5 anos" and not "5 anos e 0 meses".
 *
 * A hook rather than a pure function because the answer is translated, and the
 * plural rules are i18next's — "1 mês" against "2 meses" is not a suffix.
 */
export function useAgeLabel(): (birthDate: string) => string {
  const { t } = useTranslation()

  return (birthDate: string) => {
    const total = ageInMonths(birthDate)

    if (total < 24) {
      return t('babies.age.months', { count: total })
    }

    const years = Math.floor(total / 12)
    const months = total % 12

    return months === 0
      ? t('babies.age.years', { count: years })
      : `${t('babies.age.years', { count: years })} ${t('babies.age.and')} ${t('babies.age.months', { count: months })}`
  }
}
