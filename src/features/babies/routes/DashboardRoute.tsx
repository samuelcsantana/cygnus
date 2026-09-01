import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { useAllBabiesAppointments } from '@/features/appointments/api/appointments.hooks'
import { AppointmentsOverviewCard } from '@/features/appointments/components/AppointmentsOverviewCard'
import { useAllBabiesMilestones } from '@/features/milestones/api/milestones.hooks'
import { MilestonesOverviewCard } from '@/features/milestones/components/MilestonesOverviewCard'
import { useAllBabiesVaccineCalendars } from '@/features/vaccines/api/vaccines.hooks'
import { VaccinesOverviewCard } from '@/features/vaccines/components/VaccinesOverviewCard'
import { formatDateDisplay } from '@/lib/date'
import { AlertCircleIcon } from '@/shared/icons/alert-circle-icon'
import { HeartIcon } from '@/shared/icons/heart-icon'
import { SparkleIcon } from '@/shared/icons/sparkle-icon'
import { StethoscopeIcon } from '@/shared/icons/stethoscope-icon'
import { SyringeIcon } from '@/shared/icons/syringe-icon'
import { useAuthIdentityStore } from '@/shared/stores/authIdentity.store'

import { useBabies } from '../api/babies.hooks'
import type { Baby } from '../api/babies.schemas'
import { EditBabyDialog } from '../components/EditBabyDialog'
import { FamilyStrip } from '../components/FamilyStrip'
import { StatCard } from '../components/StatCard'
import { WelcomeDashboard } from '../components/WelcomeDashboard'

function getGreetingKey(): 'babies.dashboard.greetingMorning' | 'babies.dashboard.greetingAfternoon' | 'babies.dashboard.greetingEvening' {
  const hour = new Date().getHours()
  if (hour < 12) return 'babies.dashboard.greetingMorning'
  if (hour < 18) return 'babies.dashboard.greetingAfternoon'
  return 'babies.dashboard.greetingEvening'
}

export function DashboardRoute() {
  const { t, i18n } = useTranslation()
  const babies = useBabies()
  const identity = useAuthIdentityStore((state) => state.identity)
  const [editTarget, setEditTarget] = useState<Baby | null>(null)

  const vaccines = useAllBabiesVaccineCalendars()
  const appointments = useAllBabiesAppointments()
  const milestones = useAllBabiesMilestones()

  const babyList = babies.data ?? []

  // `data ?? []` is empty for three different reasons, and only one of them is
  // "this family has no children". While the request is in flight or after it
  // failed, falling through to WelcomeDashboard shows a parent of six the
  // onboarding screen — "Bem-vindo(a) ao Meu Neném! Acompanhe vacinas…" — and
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
    return <p className="py-16 text-center text-ink-muted">{t('babies.dashboard.loadError')}</p>
  }

  if (babyList.length === 0) {
    return (
      <div className="animate-fade-in-up">
        <WelcomeDashboard greetingKey={getGreetingKey()} />
      </div>
    )
  }

  const parentName = identity?.name ?? identity?.email ?? ''

  const delayedItems = vaccines.items.filter((item) => item.status === 'DELAYED')
  const appliedCount = vaccines.items.filter((item) => item.status === 'APPLIED').length
  const pendingCount = vaccines.items.length - appliedCount

  const sortedAppointments = [...appointments.items].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
  const nextAppointment = sortedAppointments.find((appointment) => appointment.status === 'SCHEDULED')
  const lastAppointment = [...sortedAppointments].reverse().find((appointment) => appointment.status === 'COMPLETED')
  const nextAppointmentBaby = babyList.find((baby) => baby.id === nextAppointment?.babyId)
  const lastAppointmentBaby = babyList.find((baby) => baby.id === lastAppointment?.babyId)

  // O estado vem de `perBaby`, não de `babyList`: cada criança tem sua própria
  // requisição de calendário, e uma pode falhar enquanto as outras respondem.
  // Derivar do agregado marcaria as seis como desconhecidas por causa de uma.
  const familyStripItems = babyList.map((baby) => {
    const entry = vaccines.perBaby.find((candidate) => candidate.baby.id === baby.id)
    return {
      baby,
      delayedVaccineCount: delayedItems.filter((item) => item.babyId === baby.id).length,
      // Sem entrada, o padrão é "não sei" — nunca "em dia".
      vaccineStatusKnown: entry ? !entry.isPending && !entry.isError : false,
    }
  })

  const affectedChildrenCount = new Set(delayedItems.map((item) => item.babyId)).size

  return (
    <div className="animate-fade-in-up">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-black text-ink">
          {t('babies.dashboard.greetingLine', { greeting: t(getGreetingKey()), name: parentName })}
        </h1>
        <p className="text-sm text-ink-muted">{t('babies.dashboard.childCount', { count: babyList.length })}</p>
      </div>

      {delayedItems.length > 0 && (
        <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 px-4 py-3">
          <span className="flex-shrink-0 text-rose-500 dark:text-rose-300">
            <AlertCircleIcon className="h-4 w-4" />
          </span>
          <p className="text-[13px] font-medium text-rose-700 dark:text-rose-300">
            <strong>{t('babies.dashboard.overdueBanner', { count: delayedItems.length })}</strong>{' '}
            {t('babies.dashboard.overdueBannerHousehold', { count: affectedChildrenCount })}
          </p>
          <Link to="/vaccines" className="ml-auto flex-shrink-0 text-xs font-bold whitespace-nowrap text-rose-700 dark:text-rose-300">
            {t('babies.dashboard.viewVaccines')}
          </Link>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {/* Mesmo motivo do chip da família: com o calendário fora do ar,
            `items` é uma lista vazia e a conta dá zero — um número que se lê
            como fato. O travessão diz "não sei", que é o que de fato se sabe. */}
        <StatCard
          icon={<SyringeIcon className="h-5 w-5" />}
          label={t('babies.dashboard.statVaccinesAppliedLabel')}
          value={vaccines.isError || vaccines.isPending ? '—' : `${appliedCount}`}
          sub={
            vaccines.isError || vaccines.isPending
              ? t('babies.dashboard.statVaccinesUnavailableSub')
              : t('babies.dashboard.statVaccinesAppliedSub', { count: pendingCount })
          }
          iconClassName="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
        />
        <StatCard
          icon={<StethoscopeIcon className="h-5 w-5" />}
          label={t('babies.dashboard.statNextAppointmentLabel')}
          value={nextAppointment ? formatDateDisplay(nextAppointment.scheduledAt.slice(0, 10), i18n.language) : '—'}
          sub={nextAppointment ? `${nextAppointment.doctorName} · ${nextAppointmentBaby?.name ?? ''}` : t('babies.dashboard.statNextAppointmentEmpty')}
          iconClassName="bg-violet-50 dark:bg-violet-950/40 text-violet-500 dark:text-violet-300"
        />
        <StatCard
          icon={<SparkleIcon className="h-5 w-5" />}
          label={t('babies.dashboard.statMilestonesLabel')}
          value={`${milestones.items.length}`}
          // Um "0" com a legenda "marcos do desenvolvimento" descreve o vazio e
          // não diz o que fazer com ele. Com nada registrado, a legenda passa a
          // apontar para a tela onde os exemplos abrem o formulário.
          sub={
            milestones.items.length === 0
              ? t('babies.dashboard.statMilestonesEmpty')
              : t('babies.dashboard.statMilestonesSub')
          }
          iconClassName="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300"
        />
        <StatCard
          icon={<HeartIcon className="h-5 w-5" />}
          label={t('babies.dashboard.statLastAppointmentLabel')}
          value={lastAppointment ? formatDateDisplay(lastAppointment.scheduledAt.slice(0, 10), i18n.language) : '—'}
          sub={
            lastAppointment
              ? `${lastAppointment.doctorName} · ${lastAppointmentBaby?.name ?? ''}`
              : t('babies.dashboard.statLastAppointmentEmpty')
          }
          iconClassName="bg-rose-50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-300"
        />
      </div>

      <div className="mb-6">
        <FamilyStrip items={familyStripItems} onEdit={setEditTarget} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <VaccinesOverviewCard
          babies={babyList}
          items={vaccines.items}
          isPending={vaccines.isPending}
          isError={vaccines.isError}
        />
        <AppointmentsOverviewCard
          babies={babyList}
          items={appointments.items}
          isPending={appointments.isPending}
          isError={appointments.isError}
        />
        <MilestonesOverviewCard
          babies={babyList}
          items={milestones.items}
          isPending={milestones.isPending}
          isError={milestones.isError}
        />
      </div>

      <EditBabyDialog baby={editTarget} onOpenChange={(open) => !open && setEditTarget(null)} />
    </div>
  )
}
