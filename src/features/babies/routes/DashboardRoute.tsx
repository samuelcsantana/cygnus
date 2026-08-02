import { useEffect, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { useAppointments } from '@/features/appointments/api/appointments.hooks'
import { useMilestones } from '@/features/milestones/api/milestones.hooks'
import { MILESTONE_CATEGORY_META } from '@/features/milestones/components/category-meta'
import { useVaccineCalendar } from '@/features/vaccines/api/vaccines.hooks'
import { ageInMonths, formatDateDisplay } from '@/lib/date'
import { cn } from '@/lib/utils'
import { AlertCircleIcon } from '@/shared/icons/alert-circle-icon'
import { CalendarIcon } from '@/shared/icons/calendar-icon'
import { HeartIcon } from '@/shared/icons/heart-icon'
import { SparkleIcon } from '@/shared/icons/sparkle-icon'
import { StethoscopeIcon } from '@/shared/icons/stethoscope-icon'
import { SyringeIcon } from '@/shared/icons/syringe-icon'
import { useAuthIdentityStore } from '@/shared/stores/authIdentity.store'
import { useSelectedBabyStore } from '@/shared/stores/selectedBaby.store'
import { babyAvatarPalette, babyInitials } from '@/shared/utils/babyAvatarColor'

import { useBabies } from '../api/babies.hooks'
import type { Baby } from '../api/babies.schemas'
import { StatCard } from '../components/StatCard'

function useGreetingKey(): 'babies.dashboard.greetingMorning' | 'babies.dashboard.greetingAfternoon' | 'babies.dashboard.greetingEvening' {
  const hour = new Date().getHours()
  if (hour < 12) return 'babies.dashboard.greetingMorning'
  if (hour < 18) return 'babies.dashboard.greetingAfternoon'
  return 'babies.dashboard.greetingEvening'
}

export function DashboardRoute() {
  const { t, i18n } = useTranslation()
  const babies = useBabies()
  const selectedBabyId = useSelectedBabyStore((state) => state.selectedBabyId)
  const setSelectedBabyId = useSelectedBabyStore((state) => state.setSelectedBabyId)

  const babyList = babies.data ?? []
  const firstBaby = babyList[0]

  useEffect(() => {
    if (!selectedBabyId && firstBaby) {
      setSelectedBabyId(firstBaby.id)
    }
  }, [selectedBabyId, firstBaby, setSelectedBabyId])

  if (babyList.length === 0) {
    return (
      <div className="animate-fade-in-up mx-auto flex max-w-4xl flex-col items-center py-8 text-center md:py-12">
        <div className="border-primary/20 bg-primary/5 text-primary mb-8 inline-flex items-center rounded-full border px-4 py-2 text-sm font-bold shadow-sm">
          <span className="bg-primary mr-2 flex h-2 w-2 animate-pulse rounded-full" />
          {t('babies.dashboard.eyebrowEmpty')}
        </div>

        <h2 className="font-display mb-6 text-4xl leading-[1.15] font-black tracking-tight text-ink md:text-5xl">
          {t('babies.dashboard.headingEmptyLine1')} <br className="hidden md:block" />
          <span className="from-primary bg-gradient-to-r to-teal-600 bg-clip-text text-transparent">
            {t('babies.dashboard.headingEmptyHighlight')}
          </span>
        </h2>

        <p className="mb-12 max-w-2xl text-lg leading-relaxed text-ink-muted md:text-xl">
          {t('babies.dashboard.subtitleEmpty')}
        </p>

        <div className="mb-12 grid w-full grid-cols-1 gap-6 text-left md:grid-cols-3">
          <FeatureCard
            icon={<SyringeIcon className="h-6 w-6" />}
            iconClassName="bg-rose-50 text-rose-500"
            title={t('babies.dashboard.featureVaccinesTitle')}
            description={t('babies.dashboard.featureVaccinesDesc')}
          />
          <FeatureCard
            icon={<CalendarIcon className="h-6 w-6" />}
            iconClassName="bg-violet-50 text-violet-500"
            title={t('babies.dashboard.featureAppointmentsTitle')}
            description={t('babies.dashboard.featureAppointmentsDesc')}
          />
          <FeatureCard
            icon={<SparkleIcon className="h-6 w-6" />}
            iconClassName="bg-amber-50 text-amber-500"
            title={t('babies.dashboard.featureMilestonesTitle')}
            description={t('babies.dashboard.featureMilestonesDesc')}
          />
        </div>

        <Link
          to="/add-baby"
          className="group mx-auto flex items-center rounded-2xl bg-teal-600 px-10 py-4 text-lg font-bold text-white shadow-xl shadow-teal-900/20 transition-all hover:scale-[1.02] hover:bg-teal-700 active:scale-[0.98]"
        >
          {t('babies.dashboard.ctaAddFirstChild')}
        </Link>
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
  const greetingKey = useGreetingKey()

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
  const palette = babyAvatarPalette(baby.id)
  const parentName = identity?.name ?? identity?.email ?? ''

  return (
    <div className="animate-fade-in-up">
      <div className="mb-5">
        <p className="text-primary mb-1 text-xs font-bold tracking-wider uppercase">{t('babies.dashboard.eyebrow')}</p>
        <h2 className="font-display text-2xl font-extrabold text-ink">{t('babies.dashboard.heading')}</h2>
        <p className="mt-0.5 text-sm text-ink-muted">{t('babies.dashboard.subtitle')}</p>
      </div>

      <div className="mb-7">
        <div className="mb-1.5 flex items-center gap-3.5">
          {baby.avatarUrl ? (
            <img src={baby.avatarUrl} alt="" className="h-12 w-12 flex-shrink-0 rounded-full bg-teal-50 object-cover" />
          ) : (
            <span
              className={cn(
                'font-display flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-lg font-black',
                palette.bg,
                palette.text,
              )}
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

interface FeatureCardProps {
  icon: ReactNode
  iconClassName: string
  title: string
  description: string
}

function FeatureCard({ icon, iconClassName, title, description }: FeatureCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
      <div className={cn('mb-5 flex h-12 w-12 items-center justify-center rounded-xl', iconClassName)}>{icon}</div>
      <h3 className="font-display mb-2 text-lg font-bold text-ink">{title}</h3>
      <p className="text-sm leading-relaxed text-ink-muted">{description}</p>
    </div>
  )
}
