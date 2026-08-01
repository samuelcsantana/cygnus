import { useEffect, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { cn } from '@/lib/utils'
import { CalendarIcon } from '@/shared/icons/calendar-icon'
import { SparkleIcon } from '@/shared/icons/sparkle-icon'
import { SyringeIcon } from '@/shared/icons/syringe-icon'
import { useSelectedBabyStore } from '@/shared/stores/selectedBaby.store'

import { useBabies } from '../api/babies.hooks'
import { BabySelectorStrip } from '../components/BabySelectorStrip'

export function DashboardRoute() {
  const { t } = useTranslation()
  const babies = useBabies()
  const selectedBabyId = useSelectedBabyStore((state) => state.selectedBabyId)
  const setSelectedBabyId = useSelectedBabyStore((state) => state.setSelectedBabyId)

  const babyList = babies.data ?? []
  const onlyBaby = babyList.length === 1 ? babyList[0] : undefined

  useEffect(() => {
    if (!selectedBabyId && onlyBaby) {
      setSelectedBabyId(onlyBaby.id)
    }
  }, [selectedBabyId, onlyBaby, setSelectedBabyId])

  if (babyList.length === 0) {
    return (
      <div className="animate-fade-in-up mx-auto flex max-w-4xl flex-col items-center py-8 text-center md:py-12">
        <div className="border-primary/20 bg-primary/5 text-primary mb-8 inline-flex items-center rounded-full border px-4 py-2 text-sm font-bold shadow-sm">
          <span className="bg-primary mr-2 flex h-2 w-2 animate-pulse rounded-full" />
          {t('babies.dashboard.eyebrowEmpty')}
        </div>

        <h2 className="mb-6 text-4xl leading-[1.15] font-black tracking-tight text-slate-900 md:text-5xl">
          {t('babies.dashboard.headingEmptyLine1')} <br className="hidden md:block" />
          <span className="from-primary bg-gradient-to-r to-indigo-600 bg-clip-text text-transparent">
            {t('babies.dashboard.headingEmptyHighlight')}
          </span>
        </h2>

        <p className="mb-12 max-w-2xl text-lg leading-relaxed text-slate-500 md:text-xl">
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
            iconClassName="bg-indigo-50 text-indigo-500"
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
          className="group mx-auto flex items-center rounded-2xl bg-slate-900 px-10 py-4 text-lg font-bold text-white shadow-xl shadow-slate-900/20 transition-all hover:scale-[1.02] hover:bg-slate-800 active:scale-[0.98]"
        >
          {t('babies.dashboard.ctaAddFirstChild')}
        </Link>
      </div>
    )
  }

  return (
    <div className="animate-fade-in-up">
      <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-primary mb-1 text-sm font-semibold tracking-wider uppercase">
            {t('babies.dashboard.eyebrow')}
          </p>
          <h2 className="text-3xl font-extrabold text-slate-900">{t('babies.dashboard.heading')}</h2>
          <p className="mt-1 text-lg text-slate-500">{t('babies.dashboard.subtitle')}</p>
        </div>
        <Link
          to="/add-baby"
          className="flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          {t('babies.addChild')}
        </Link>
      </div>

      <div className="mb-10">
        <h3 className="mb-4 text-lg font-bold text-slate-900">{t('babies.yourChildren')}</h3>
        <BabySelectorStrip babies={babyList} />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatCard
          to="/vaccines"
          icon={<SyringeIcon className="h-7 w-7" />}
          iconClassName="bg-rose-50 text-rose-500 group-hover:bg-rose-500 group-hover:text-white"
          label={t('babies.dashboard.statVaccinesLabel')}
        />
        <StatCard
          to="/appointments"
          icon={<CalendarIcon className="h-7 w-7" />}
          iconClassName="bg-indigo-50 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white"
          label={t('babies.dashboard.statAppointmentsLabel')}
        />
        <StatCard
          to="/milestones"
          icon={<SparkleIcon className="h-7 w-7" />}
          iconClassName="bg-amber-50 text-amber-500 group-hover:bg-amber-500 group-hover:text-white"
          label={t('babies.dashboard.statMilestonesLabel')}
        />
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
      <h3 className="mb-2 text-lg font-bold text-slate-900">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-500">{description}</p>
    </div>
  )
}

interface StatCardProps {
  to: string
  icon: ReactNode
  iconClassName: string
  label: string
}

function StatCard({ to, icon, iconClassName, label }: StatCardProps) {
  const { t } = useTranslation()
  return (
    <Link
      to={to}
      className="group flex flex-col justify-between rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg"
    >
      <div className={cn('mb-6 flex h-14 w-14 items-center justify-center rounded-2xl transition-colors', iconClassName)}>
        {icon}
      </div>
      <div>
        <p className="mb-1 text-sm font-semibold tracking-wider text-slate-500 uppercase">{label}</p>
        <p className="text-sm text-slate-400">{t('babies.dashboard.statComingSoon')}</p>
      </div>
    </Link>
  )
}
