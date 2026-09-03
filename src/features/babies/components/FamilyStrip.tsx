import { useTranslation } from 'react-i18next'

import type { Baby } from '@/features/babies/api/babies.schemas'
import { ageInMonths } from '@/lib/date'
import { cn } from '@/lib/utils'
import { PencilIcon } from '@/shared/icons/pencil-icon'
import { babyAvatarAppearance, babyInitials } from '@/shared/utils/babyAvatarColor'

export interface FamilyStripItem {
  baby: Baby
  delayedVaccineCount: number
  /**
   * Falso enquanto o calendário da criança não carregou — carregando ou erro.
   *
   * Sem isto o chip lê `delayedVaccineCount === 0` e anuncia "Vacinas em dia",
   * que é o valor que uma lista vazia produz **também quando a requisição
   * falhou**. Num app cuja razão de existir é acompanhar o calendário do PNI,
   * afirmar que a criança está em dia sem ter o dado é a pior falha possível:
   * a pessoa não vê erro nenhum e conclui que não há nada a fazer.
   */
  vaccineStatusKnown: boolean
}

interface FamilyStripProps {
  items: FamilyStripItem[]
  onEdit: (baby: Baby) => void
}

// Compact per-child roster replacing what used to be a full stats+lists
// section per baby — one glance at who's who and who needs attention,
// without repeating the same big layout once per child.
//
// Since 03/09/2026 this is the /vaccines roster only; the dashboard moved to
// BabyHeroCard. The two are not a duplication to be collapsed — they answer
// different questions on purpose:
//
// - The hero says *who this child is*: it is the headline of the page, and it
//   carries the health fields (blood type, allergies) that exist nowhere else
//   in the UI.
// - This strip only says *which child is which*, above a long vaccine list
//   that is the actual content of that page. Heroes there would push the list
//   far below the fold, and they would repeat the vaccine status chip on the
//   one screen where the status is already the subject.
//
// What they do share is the `vaccineStatusKnown` distinction below, which is
// why the i18n keys are named `babies.dashboard.vaccineStatus*` and not after
// either component.
export function FamilyStrip({ items, onEdit }: FamilyStripProps) {
  const { t } = useTranslation()

  // Rola no celular e quebra linha no desktop.
  //
  // Rolagem horizontal é o padrão certo para uma fila de chips num telefone,
  // mas a 1440px com seis filhos o último cartão ficava cortado no meio da
  // palavra, sem nenhuma indicação de que havia mais — lia como defeito de
  // layout, não como convite a rolar. No desktop sobra espaço vertical, então
  // quebrar linha não esconde nada e dispensa medir transbordo com JS só para
  // desenhar um degradê na borda.
  return (
    <div className="flex gap-3 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-x-visible">
      {items.map(({ baby, delayedVaccineCount, vaccineStatusKnown }) => {
        const avatarAppearance = babyAvatarAppearance(baby.id, baby.avatarColor)
        return (
          <div
            key={baby.id}
            className="group flex flex-shrink-0 items-center gap-3 rounded-2xl bg-card py-2.5 pr-2 pl-2.5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
          >
            {baby.avatarUrl ? (
              <img
                src={baby.avatarUrl}
                alt=""
                className={cn(
                  'h-11 w-11 flex-shrink-0 rounded-full bg-emerald-50 dark:bg-emerald-950/40 object-cover',
                  baby.avatarColor && 'border-2',
                )}
                style={baby.avatarColor ? { borderColor: baby.avatarColor } : undefined}
              />
            ) : (
              <span
                className={cn(
                  'font-display flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-base font-black',
                  avatarAppearance.className,
                )}
                style={avatarAppearance.style}
              >
                {babyInitials(baby.name)}
              </span>
            )}
            <div className="min-w-0 pr-1">
              <p className="truncate text-[13px] font-bold text-ink">{baby.name}</p>
              <p className="text-[11px] text-ink-muted">{t('babies.monthsOld', { count: ageInMonths(baby.birthDate) })}</p>
              {/* A ordem importa: o caso "não sei" vem antes de qualquer
                  afirmação. Um atraso conhecido ainda é reportado, porque essa
                  informação é sempre verdadeira quando existe. */}
              {!vaccineStatusKnown ? (
                <p className="text-[11px] font-bold text-ink-faint">
                  {t('babies.dashboard.vaccineStatusUnknown')}
                </p>
              ) : delayedVaccineCount > 0 ? (
                <p className="text-[11px] font-bold text-rose-600 dark:text-rose-300">
                  {t('babies.dashboard.vaccineStatusDelayed', { count: delayedVaccineCount })}
                </p>
              ) : (
                <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">{t('babies.dashboard.vaccineStatusUpToDate')}</p>
              )}
            </div>
            {/* Touch target: the -inset-2.5 pseudo-element expands the tappable
                area to the WCAG 44x44px minimum without enlarging the visible
                icon or disturbing the compact card layout. Default opacity is
                dimmed rather than 0 so the action is discoverable on touch
                devices (no :hover state there); keyboard focus and hover both
                bring it to full opacity. */}
            <span className="relative flex-shrink-0 self-start">
              <button
                type="button"
                onClick={() => onEdit(baby)}
                aria-label={t('babies.edit.action', { name: baby.name })}
                className="relative rounded-lg p-1.5 text-ink-faint opacity-60 transition-opacity hover:bg-muted hover:text-emerald-700 dark:hover:text-emerald-300 hover:opacity-100 focus-visible:opacity-100 group-focus-within:opacity-100 group-hover:opacity-100"
              >
                <span className="absolute -inset-2.5" aria-hidden="true" />
                <PencilIcon className="h-3.5 w-3.5" />
              </button>
            </span>
          </div>
        )
      })}
    </div>
  )
}
