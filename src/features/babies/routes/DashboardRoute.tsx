import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { useAllBabiesAppointments } from '@/features/appointments/api/appointments.hooks'
import { growthSeries } from '@/features/growth/api/growth.selectors'
import { AppointmentsOverviewCard } from '@/features/appointments/components/AppointmentsOverviewCard'
import { useAllBabiesMilestones } from '@/features/milestones/api/milestones.hooks'
import { useAllBabiesMedications } from '@/features/medications/api/medications.hooks'
import { MedicationsOverviewCard } from '@/features/medications/components/MedicationsOverviewCard'
import { MilestonesOverviewCard } from '@/features/milestones/components/MilestonesOverviewCard'
import { useAllBabiesVaccineCalendars } from '@/features/vaccines/api/vaccines.hooks'
import { VaccinesOverviewCard } from '@/features/vaccines/components/VaccinesOverviewCard'
import { formatDateDisplay, splitScheduledAt } from '@/lib/date'
import { formatCentimeters, formatKilograms } from '@/shared/utils/measurements'
import { useAuthIdentityStore } from '@/shared/stores/authIdentity.store'
import { useSelectedBabyStore } from '@/shared/stores/selectedBaby.store'

import { useBabies } from '../api/babies.hooks'
import type { Baby } from '../api/babies.schemas'
import { EditBabyDialog } from '../components/EditBabyDialog'
import { BabyHeroCard } from '../components/BabyHeroCard'
import { WelcomeDashboard } from '../components/WelcomeDashboard'

function getGreetingKey():
  | 'babies.dashboard.greetingMorning'
  | 'babies.dashboard.greetingAfternoon'
  | 'babies.dashboard.greetingEvening' {
  const hour = new Date().getHours()
  if (hour < 12) return 'babies.dashboard.greetingMorning'
  if (hour < 18) return 'babies.dashboard.greetingAfternoon'
  return 'babies.dashboard.greetingEvening'
}

export function DashboardRoute() {
  const { t, i18n } = useTranslation()
  const babies = useBabies()
  const identity = useAuthIdentityStore((state) => state.identity)
  const selectedBabyId = useSelectedBabyStore((state) => state.selectedBabyId)
  const [editTarget, setEditTarget] = useState<Baby | null>(null)

  const vaccines = useAllBabiesVaccineCalendars()
  const appointments = useAllBabiesAppointments()
  const milestones = useAllBabiesMilestones()
  const medications = useAllBabiesMedications()

  const babyList = babies.data ?? []

  // `data ?? []` is empty for three different reasons, and only one of them is
  // "this family has no children". While the request is in flight or after it
  // failed, falling through to WelcomeDashboard shows a parent of six the
  // onboarding screen — "Bem-vindo(a) ao Ninho! Acompanhe vacinas…" — and
  // then swaps it for their real dashboard. Measured by delaying GET /babies by
  // 5s: the welcome copy rendered for the whole delay.
  //
  // The other widgets on this page already branch on their own pending/error;
  // this query is different because it decides which screen exists at all.
  if (babies.isPending) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-10 w-64 rounded-xl bg-card shadow-sm" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <div key={index} className="h-28 rounded-2xl bg-card shadow-sm" />
          ))}
        </div>
        <div className="h-24 rounded-2xl bg-card shadow-sm" />
      </div>
    )
  }

  if (babies.isError) {
    return (
      <div role="alert" className="rounded-2xl bg-card p-8 text-center">
        <p>{t('babies.dashboard.loadError')}</p>
        <button
          type="button"
          onClick={() => void babies.refetch()}
          className="mt-4 min-h-11 rounded-xl bg-primary px-5 text-primary-foreground"
        >
          {t('nav.shell.retry')}
        </button>
      </div>
    )
  }

  if (babyList.length === 0) {
    return (
      <div className="animate-fade-in-up">
        <WelcomeDashboard greetingKey={getGreetingKey()} />
      </div>
    )
  }

  const parentName = identity?.name ?? identity?.email ?? ''

  // Narrowed to the child chosen in the menu, or the whole family when none is.
  // Applied once, here, so every number and every card below answers for the
  // same set — a page where the hero card is one child and the counters are six
  // is worse than either view on its own.
  //
  // The empty-state check above stays on the full list on purpose: a household
  // with children never sees the welcome screen because of a filter.
  const visibleBabies = selectedBabyId
    ? babyList.filter((baby) => baby.id === selectedBabyId)
    : babyList
  const forSelection = <T extends { babyId: string }>(items: T[]): T[] =>
    selectedBabyId ? items.filter((item) => item.babyId === selectedBabyId) : items

  const visibleVaccineItems = forSelection(vaccines.items)
  const visibleAppointments = forSelection(appointments.items)
  const visibleMilestones = forSelection(milestones.items)
  const visibleMedications = forSelection(medications.items)

  const delayedItems = visibleVaccineItems.filter((item) => item.status === 'DELAYED')
  // O estado vem de `perBaby`, não de `babyList`: cada criança tem sua própria
  // requisição de calendário, e uma pode falhar enquanto as outras respondem.
  // Derivar do agregado marcaria as seis como desconhecidas por causa de uma.
  const familyItems = visibleBabies.map((baby) => {
    const entry = vaccines.perBaby.find((candidate) => candidate.baby.id === baby.id)
    // As consultas já estão carregadas nesta tela para os cartões abaixo, então a última medida
    // sai daqui sem uma requisição a mais — que é o que torna barato mostrar peso e altura no
    // perfil sem duplicar o dado que mora na consulta.
    const appointmentEntry = appointments.perBaby.find((candidate) => candidate.baby.id === baby.id)
    return {
      baby,
      delayedVaccineCount: delayedItems.filter((item) => item.babyId === baby.id).length,
      // Sem entrada, o padrão é "não sei" — nunca "em dia".
      vaccineStatusKnown: entry ? !entry.isPending && !entry.isError : false,
      latestMeasuredVisit:
        growthSeries(appointmentEntry?.items ?? [], baby.birthDate, baby.measurements).at(-1) ??
        null,
    }
  })

  const stateFor = (entries: { baby: Baby; isPending: boolean; isError: boolean }[]) => {
    const selected = entries.filter((entry) =>
      visibleBabies.some((baby) => baby.id === entry.baby.id),
    )
    return {
      isPending: selected.some((entry) => entry.isPending),
      isError: selected.some((entry) => entry.isError),
    }
  }
  const vaccineState = stateFor(vaccines.perBaby)
  const appointmentState = stateFor(appointments.perBaby)
  const milestoneState = stateFor(milestones.perBaby)
  const medicationState = stateFor(medications.perBaby)
  const ready = [vaccineState, appointmentState, milestoneState, medicationState].every(
    (state) => !state.isPending && !state.isError,
  )
  const firstRecords =
    ready &&
    !visibleAppointments.length &&
    !visibleMilestones.length &&
    !visibleMedications.length &&
    !visibleVaccineItems.some((item) => item.status === 'APPLIED')
  return (
    <div className="animate-fade-in-up">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-medium text-ink">
          {t('babies.dashboard.greetingLine', { greeting: t(getGreetingKey()), name: parentName })}
        </h1>
        <p className="text-sm text-ink-muted">
          {t('babies.dashboard.childCount', { count: visibleBabies.length })}
        </p>
      </div>

      <div className="mb-6 grid gap-3 lg:grid-cols-2">
        {familyItems.map((item) => (
          <BabyHeroCard key={item.baby.id} {...item} compact onEdit={setEditTarget} />
        ))}
      </div>
      {firstRecords && (
        <section className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-6">
          <h2 className="font-display text-xl font-medium text-ink">{t('babies.home.start')}</h2>
          <p className="mt-1 text-sm text-ink-muted">{t('babies.home.startBody')}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              ['/vaccines', 'recordVaccines'],
              ['/appointments', 'schedule'],
              ['/milestones', 'memory'],
            ].map(([to, key]) => (
              <Link
                key={to}
                to={to!}
                className="inline-flex min-h-11 items-center rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-primary"
              >
                {t(`babies.home.${key}`)}
              </Link>
            ))}
          </div>
        </section>
      )}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-5">
          <h2 className="font-display text-xl font-medium text-ink">{t('babies.home.care')}</h2>
          <AppointmentsOverviewCard
            babies={visibleBabies}
            items={visibleAppointments}
            {...appointmentState}
          />
          <VaccinesOverviewCard
            babies={visibleBabies}
            items={visibleVaccineItems}
            {...vaccineState}
          />
          <MedicationsOverviewCard
            babies={visibleBabies}
            items={visibleMedications}
            {...medicationState}
          />
        </div>
        <div className="min-w-0 space-y-5">
          <h2 className="font-display text-xl font-medium text-ink">{t('babies.home.growing')}</h2>
          <section className="rounded-2xl border border-border/60 bg-overview-sage p-5">
            <h3 className="mb-4 font-display text-lg font-medium text-ink">{t('nav.growth')}</h3>
            <div className="space-y-4">
              {familyItems.map(({ baby, latestMeasuredVisit: measurement }) => (
                <div key={baby.id}>
                  <p className="text-sm font-semibold text-ink">{baby.name}</p>
                  {appointmentState.isError || appointmentState.isPending ? (
                    <p className="text-sm text-ink-muted">{t('babies.home.measureUnavailable')}</p>
                  ) : measurement ? (
                    <>
                      <p className="mt-1 font-mono text-sm text-ink">
                        {[
                          measurement.weightGrams !== null
                            ? formatKilograms(measurement.weightGrams, i18n.language)
                            : null,
                          measurement.heightMillimeters !== null
                            ? formatCentimeters(measurement.heightMillimeters, i18n.language)
                            : null,
                        ]
                          .filter(Boolean)
                          .join(' / ')}
                      </p>
                      <p className="mt-1 text-xs text-ink-muted">
                        {t('babies.hero.measuredOn')}{' '}
                        {formatDateDisplay(
                          splitScheduledAt(measurement.scheduledAt).date,
                          i18n.language,
                        )}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-ink-muted">{t('babies.home.noMeasurement')}</p>
                  )}
                </div>
              ))}
            </div>
            <Link
              to="/growth"
              className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-primary"
            >
              {t('babies.home.growthLink')}
            </Link>
          </section>
          <MilestonesOverviewCard
            babies={visibleBabies}
            items={visibleMilestones}
            {...milestoneState}
          />
        </div>
      </div>

      <EditBabyDialog baby={editTarget} onOpenChange={(open) => !open && setEditTarget(null)} />
    </div>
  )
}
