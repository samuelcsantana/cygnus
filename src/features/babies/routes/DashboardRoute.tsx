import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { useAppointments } from '@/features/appointments/api/appointments.hooks'
import { useMilestones } from '@/features/milestones/api/milestones.hooks'
import { MILESTONE_CATEGORY_META } from '@/features/milestones/components/category-meta'
import { useVaccineCalendar } from '@/features/vaccines/api/vaccines.hooks'
import { ageInMonths, formatDateDisplay } from '@/lib/date'
import { cn } from '@/lib/utils'
import { AlertCircleIcon } from '@/shared/icons/alert-circle-icon'
import { HeartIcon } from '@/shared/icons/heart-icon'
import { SparkleIcon } from '@/shared/icons/sparkle-icon'
import { StethoscopeIcon } from '@/shared/icons/stethoscope-icon'
import { SyringeIcon } from '@/shared/icons/syringe-icon'
import { useAuthIdentityStore } from '@/shared/stores/authIdentity.store'
import { useSelectedBabyStore } from '@/shared/stores/selectedBaby.store'
import { babyAvatarAppearance, babyInitials } from '@/shared/utils/babyAvatarColor'

import { useBabies } from '../api/babies.hooks'
import type { Baby } from '../api/babies.schemas'
import { StatCard } from '../components/StatCard'
import { WelcomeDashboard } from '../components/WelcomeDashboard'

function getGreetingKey(): 'babies.dashboard.greetingMorning' | 'babies.dashboard.greetingAfternoon' | 'babies.dashboard.greetingEvening' {
  const hour = new Date().getHours()
  if (hour < 12) return 'babies.dashboard.greetingMorning'
  if (hour < 18) return 'babies.dashboard.greetingAfternoon'
  return 'babies.dashboard.greetingEvening'
}

export function DashboardRoute() {
  const { i18n } = useTranslation()
  const babies = useBabies()
  const selectedBabyId = useSelectedBabyStore((state) => state.selectedBabyId)
  const setSelectedBabyId = useSelectedBabyStore((state) => state.setSelectedBabyId)

  const babyList = babies.data ?? []
  const firstBaby = babyList[0]

  useEffect(() => {
    if (!babies.data) return
    // Not just "no selection yet": a selection can also be stale — pointing at a
    // baby that isn't in this account's list (e.g. a different account tested
    // earlier in the same browser, or a baby removed since) — and self-heals to
    // the same default a fresh first login would get.
    const isValidSelection = babies.data.some((baby) => baby.id === selectedBabyId)
    if (!isValidSelection && firstBaby) {
      setSelectedBabyId(firstBaby.id)
    }
  }, [babies.data, selectedBabyId, firstBaby, setSelectedBabyId])

  if (babyList.length === 0) {
    return (
      <div className="animate-fade-in-up">
        <WelcomeDashboard greetingKey={getGreetingKey()} />
      </div>
    )
  }

  const selectedBaby = babyList.find((baby) => baby.id === selectedBabyId) ?? firstBaby!

  return <DashboardContent baby={selectedBaby} locale={i18n.language} />
}

interface DashboardContentProps {
  baby: Baby
  locale: string
}

function DashboardContent({ baby, locale }: DashboardContentProps) {
  const { t } = useTranslation()
  const identity = useAuthIdentityStore((state) => state.identity)
  const greetingKey = getGreetingKey()

  const vaccineCalendar = useVaccineCalendar(baby.id)
  const appointments = useAppointments(baby.id)
  const milestones = useMilestones(baby.id)

  const vaccineItems = (vaccineCalendar.data ?? []).flatMap((group) => group.items)
  const appliedCount = vaccineItems.filter((item) => item.status === 'APPLIED').length
  const delayedItems = vaccineItems.filter((item) => item.status === 'DELAYED')
  const pendingCount = vaccineItems.filter((item) => item.status !== 'APPLIED').length
  const upcomingVaccines = vaccineItems.filter((item) => item.status !== 'APPLIED').slice(0, 4)

  const appointmentList = appointments.data ?? []
  const nextAppointment = appointmentList.find((appointment) => appointment.status === 'SCHEDULED')
  const lastAppointment = [...appointmentList].reverse().find((appointment) => appointment.status === 'COMPLETED')

  const babyMilestones = milestones.data ?? []
  const latestMilestones = babyMilestones.slice(0, 3)

  const babyAge = t('babies.monthsOld', { count: ageInMonths(baby.birthDate) })
  const avatarAppearance = babyAvatarAppearance(baby.id, baby.avatarColor)
  const parentName = identity?.name ?? identity?.email ?? ''

  return (
    <div className="animate-fade-in-up">
      <div className="mb-7">
        <div className="mb-1.5 flex items-center gap-3.5">
          {baby.avatarUrl ? (
            <img
              src={baby.avatarUrl}
              alt=""
              className={cn('h-12 w-12 flex-shrink-0 rounded-full bg-teal-50 object-cover', baby.avatarColor && 'border-2')}
              style={baby.avatarColor ? { borderColor: baby.avatarColor } : undefined}
            />
          ) : (
            <span
              className={cn(
                'font-display flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-lg font-black',
                avatarAppearance.className,
              )}
              style={avatarAppearance.style}
            >
              {babyInitials(baby.name)}
            </span>
          )}
          <div>
            <h1 className="font-display text-2xl font-black text-ink">
              {t('babies.dashboard.greetingLine', { greeting: t(greetingKey), name: parentName })}
            </h1>
            <p className="text-sm text-ink-muted">
              {t('babies.dashboard.viewingProfile', { name: baby.name })} · {babyAge}
            </p>
          </div>
        </div>

        {delayedItems.length > 0 && (
          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
            <span className="flex-shrink-0 text-rose-500">
              <AlertCircleIcon className="h-4 w-4" />
            </span>
            <p className="text-[13px] font-medium text-rose-700">
              <strong>{t('babies.dashboard.overdueBanner', { count: delayedItems.length })}</strong>{' '}
              {t('babies.dashboard.overdueBannerSuffix', { name: baby.name })}
            </p>
            <Link to="/vaccines" className="ml-auto text-xs font-bold whitespace-nowrap text-rose-700">
              {t('babies.dashboard.viewVaccines')}
            </Link>
          </div>
        )}
      </div>

      <div className="mb-7 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <StatCard
          icon={<SyringeIcon className="h-5 w-5" />}
          label={t('babies.dashboard.statVaccinesAppliedLabel')}
          value={`${appliedCount}`}
          sub={t('babies.dashboard.statVaccinesAppliedSub', { count: pendingCount })}
          iconClassName="bg-teal-50 text-teal-600"
        />
        <StatCard
          icon={<StethoscopeIcon className="h-5 w-5" />}
          label={t('babies.dashboard.statNextAppointmentLabel')}
          value={nextAppointment ? formatDateDisplay(nextAppointment.scheduledAt.slice(0, 10), locale) : '—'}
          sub={nextAppointment ? nextAppointment.doctorName : t('babies.dashboard.statNextAppointmentEmpty')}
          iconClassName="bg-violet-50 text-violet-500"
        />
        <StatCard
          icon={<SparkleIcon className="h-5 w-5" />}
          label={t('babies.dashboard.statMilestonesLabel')}
          value={`${babyMilestones.length}`}
          sub={t('babies.dashboard.statMilestonesSub')}
          iconClassName="bg-amber-50 text-amber-500"
        />
        <StatCard
          icon={<HeartIcon className="h-5 w-5" />}
          label={t('babies.dashboard.statLastAppointmentLabel')}
          value={lastAppointment ? formatDateDisplay(lastAppointment.scheduledAt.slice(0, 10), locale) : '—'}
          sub={lastAppointment ? lastAppointment.doctorName : '—'}
          iconClassName="bg-rose-50 text-rose-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-base font-extrabold text-ink">
              {t('babies.dashboard.latestMilestonesTitle')}
            </h3>
            <Link to="/milestones" className="text-xs font-bold text-teal-700">
              {t('babies.dashboard.viewAllMilestones')}
            </Link>
          </div>
          <div className="flex flex-col gap-3.5">
            {latestMilestones.length === 0 ? (
              <p className="py-5 text-center text-[13px] text-ink-muted">
                {t('babies.dashboard.noMilestonesYet')}
              </p>
            ) : (
              latestMilestones.map((milestone) => {
                const meta = MILESTONE_CATEGORY_META[milestone.category]
                return (
                  <div key={milestone.id} className="flex items-start gap-3">
                    <span className="flex-shrink-0 text-xl">{meta.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="mb-0.5 truncate text-[13px] font-bold text-ink">{milestone.title}</p>
                      <div className="flex items-center gap-2">
                        <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', meta.badgeClass)}>
                          {t(`milestones.category.${milestone.category.toLowerCase()}`)}
                        </span>
                        <span className="text-[11px] text-ink-muted">
                          {formatDateDisplay(milestone.achievedAt, locale)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-base font-extrabold text-ink">
              {t('babies.dashboard.vaccineCalendarTitle')}
            </h3>
            <Link to="/vaccines" className="text-xs font-bold text-teal-700">
              {t('babies.dashboard.viewAllVaccines')}
            </Link>
          </div>
          <div className="flex flex-col gap-2.5">
            {upcomingVaccines.length === 0 ? (
              <p className="py-5 text-center text-[13px] text-ink-muted">
                {t('babies.dashboard.allVaccinesUpToDate')}
              </p>
            ) : (
              upcomingVaccines.map((item) => (
                <div
                  key={item.vaccineId}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2.5',
                    item.status === 'DELAYED' ? 'bg-rose-50' : 'bg-surface',
                  )}
                >
                  <span
                    className={cn(
                      'h-2 w-2 flex-shrink-0 rounded-full',
                      item.status === 'DELAYED' ? 'bg-rose-500' : 'bg-amber-400',
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ink">{item.name}</p>
                    <p className="text-[11px] text-ink-muted">
                      {t('vaccines.doseLabel', { count: item.doseNumber })} ·{' '}
                      {t('vaccines.ageGroupLabel', { count: item.recommendedAgeInMonths })}
                    </p>
                  </div>
                  <span className="flex-shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                    {item.status === 'DELAYED' ? t('vaccines.status.delayed') : t('vaccines.status.pending')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
