import { Fragment, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import { BellIcon } from '@/shared/icons/bell-icon'
import { DashboardIcon } from '@/shared/icons/dashboard-icon'
import { LogoIcon } from '@/shared/icons/logo-icon'
import { PlusIcon } from '@/shared/icons/plus-icon'
import { SparkleIcon } from '@/shared/icons/sparkle-icon'
import { StethoscopeIcon } from '@/shared/icons/stethoscope-icon'
import { SyringeIcon } from '@/shared/icons/syringe-icon'
import { useAddBabyDialogStore } from '@/shared/stores/addBabyDialog.store'
import { useAuthIdentityStore } from '@/shared/stores/authIdentity.store'

interface WelcomeDashboardProps {
  greetingKey: string
}

interface PreviewVaccineItem {
  name: string
  dose: string
  status: 'taken' | 'overdue' | 'pending'
}

interface PreviewMilestoneItem {
  title: string
  date: string
  category: string
}

interface PreviewAppointmentItem {
  doctorName: string
  specialty: string
  date: string
  status: 'scheduled' | 'completed'
}

interface PreviewNotificationItem {
  text: string
}

interface StepItem {
  title: string
  description: string
}

const VACCINE_STATUS_STYLE: Record<PreviewVaccineItem['status'], { bg: string; text: string; symbol: string }> = {
  taken: { bg: 'bg-teal-50', text: 'text-teal-700', symbol: '✓' },
  overdue: { bg: 'bg-rose-50', text: 'text-rose-700', symbol: '!' },
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', symbol: '○' },
}

const MILESTONE_CATEGORY_STYLE: Record<string, { bg: string; text: string }> = {
  social: { bg: 'bg-amber-50', text: 'text-amber-700' },
  motor: { bg: 'bg-teal-50', text: 'text-teal-700' },
  language: { bg: 'bg-violet-50', text: 'text-violet-600' },
}

const STEP_ICONS = [PlusIcon, SyringeIcon, DashboardIcon]

export function WelcomeDashboard({ greetingKey }: WelcomeDashboardProps) {
  const { t } = useTranslation()
  const identity = useAuthIdentityStore((state) => state.identity)
  const parentName = identity?.name ?? identity?.email ?? ''
  const openAddBabyDialog = useAddBabyDialogStore((state) => state.open)

  const vaccineItems = t('babies.dashboard.previewVaccines.items', { returnObjects: true }) as PreviewVaccineItem[]
  const milestoneItems = t('babies.dashboard.previewMilestones.items', { returnObjects: true }) as PreviewMilestoneItem[]
  const appointmentItems = t('babies.dashboard.previewAppointments.items', {
    returnObjects: true,
  }) as PreviewAppointmentItem[]
  const notificationItems = t('babies.dashboard.previewNotifications.items', {
    returnObjects: true,
  }) as PreviewNotificationItem[]
  const steps = t('babies.dashboard.steps.items', { returnObjects: true }) as StepItem[]

  return (
    <div>
      {/* Hero */}
      <div className="relative mb-7 overflow-hidden rounded-3xl bg-gradient-to-br from-teal-500 to-teal-700 p-8 sm:p-11">
        <div className="pointer-events-none absolute -top-12 -right-12 h-60 w-60 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -right-16 -bottom-20 h-80 w-80 rounded-full bg-white/[0.04]" />
        <div className="relative">
          <p className="mb-1.5 text-sm font-semibold text-white/70">
            {t(greetingKey)}, {parentName} 👋
          </p>
          <h1 className="font-display mb-3 flex items-center gap-2.5 text-3xl leading-tight font-black text-white sm:text-4xl">
            <LogoIcon className="h-7 w-7 sm:h-8 sm:w-8" />
            {t('babies.dashboard.welcomeHeading')}
          </h1>
          <p className="mb-7 max-w-xl text-[15px] leading-relaxed text-white/80">
            {t('babies.dashboard.welcomeDescription')}
          </p>
          {/* Literal white, not `bg-card`, and it must stay that way: this button
              sits on the teal hero panel, which is the same colour in both themes.
              A card-coloured surface here goes near-black in dark and the teal
              label on it collapses to an unreadable ratio — the panel does not
              flip, so nothing painted on it may flip either. */}
          <button
            type="button"
            onClick={openAddBabyDialog}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 font-display text-base font-extrabold text-teal-700 shadow-lg shadow-black/10 transition-transform hover:-translate-y-0.5"
          >
            <PlusIcon className="h-5 w-5" />
            {t('babies.dashboard.welcomeCta')}
          </button>
        </div>
      </div>

      {/* Feature previews */}
      <p className="font-display mb-3.5 text-[17px] font-extrabold text-ink">
        {t('babies.dashboard.previewSectionTitle')}
      </p>
      <div className="mb-7 grid grid-cols-1 gap-3.5 md:grid-cols-2">
        <PreviewCard
          gradientClassName="from-teal-50 to-teal-100"
          iconClassName="bg-teal-500"
          icon={<SyringeIcon className="h-[18px] w-[18px] text-white" />}
          title={t('babies.dashboard.previewVaccines.cardTitle')}
          titleClassName="text-teal-800"
          subtitle={t('babies.dashboard.previewVaccines.cardSubtitle')}
          subtitleClassName="text-teal-700"
        >
          <div className="flex flex-col gap-2.5">
            {vaccineItems.map((item, index) => {
              const style = VACCINE_STATUS_STYLE[item.status]
              return (
                <div key={index} className="flex items-center gap-2">
                  <span
                    className={cn(
                      'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md text-[10px] font-bold',
                      style.bg,
                      style.text,
                    )}
                  >
                    {style.symbol}
                  </span>
                  <span className="flex-1 truncate text-xs text-ink">{item.name}</span>
                  <span className="flex-shrink-0 text-[10px] text-ink-faint">{item.dose}</span>
                </div>
              )
            })}
            <div className="mt-1">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[11px] text-ink-muted">
                  {t('babies.dashboard.previewVaccines.progressLabel')}
                </span>
                <span className="text-[11px] font-bold text-teal-700">65%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-[65%] rounded-full bg-gradient-to-r from-teal-500 to-teal-400" />
              </div>
            </div>
          </div>
        </PreviewCard>

        <PreviewCard
          gradientClassName="from-amber-50 to-amber-100"
          iconClassName="bg-amber-500"
          icon={<SparkleIcon className="h-[18px] w-[18px] text-white" />}
          title={t('babies.dashboard.previewMilestones.cardTitle')}
          titleClassName="text-amber-900"
          subtitle={t('babies.dashboard.previewMilestones.cardSubtitle')}
          subtitleClassName="text-amber-700"
        >
          <div className="flex flex-col gap-2.5">
            {milestoneItems.map((item, index) => {
              const style = MILESTONE_CATEGORY_STYLE[item.category] ?? MILESTONE_CATEGORY_STYLE.social!
              return (
                <div key={index} className="flex items-center gap-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-ink">{item.title}</p>
                    <p className="text-[10px] text-ink-faint">{item.date}</p>
                  </div>
                  <span
                    className={cn('flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold', style.bg, style.text)}
                  >
                    {t(`milestones.category.${item.category}`)}
                  </span>
                </div>
              )
            })}
            <div className="mt-0.5 flex items-center gap-2 rounded-lg bg-surface px-2.5 py-2">
              <SparkleIcon className="h-3.5 w-3.5 flex-shrink-0 text-amber-700" />
              <p className="text-[11px] text-ink-muted">{t('babies.dashboard.previewMilestones.footerNote')}</p>
            </div>
          </div>
        </PreviewCard>

        <PreviewCard
          gradientClassName="from-violet-50 to-violet-100"
          iconClassName="bg-violet-500"
          icon={<StethoscopeIcon className="h-[18px] w-[18px] text-white" />}
          title={t('babies.dashboard.previewAppointments.cardTitle')}
          titleClassName="text-violet-900"
          subtitle={t('babies.dashboard.previewAppointments.cardSubtitle')}
          subtitleClassName="text-violet-600"
        >
          <div className="flex flex-col gap-2">
            {appointmentItems.map((item, index) => (
              <div key={index} className="flex items-center gap-2.5 rounded-lg bg-surface px-2.5 py-2">
                <StethoscopeIcon className="h-4 w-4 flex-shrink-0 text-violet-500" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-ink">{item.doctorName}</p>
                  <p className="text-[10px] text-ink-faint">
                    {item.specialty} · {item.date}
                  </p>
                </div>
                <span
                  className={cn(
                    'flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                    item.status === 'scheduled' ? 'bg-violet-50 text-violet-600' : 'bg-teal-50 text-teal-700',
                  )}
                >
                  {item.status === 'scheduled' ? t('appointments.status.scheduled') : t('appointments.status.completed')}
                </span>
              </div>
            ))}
            <p className="mt-0.5 text-[11px] text-ink-faint">{t('babies.dashboard.previewAppointments.footerNote')}</p>
          </div>
        </PreviewCard>

        <PreviewCard
          gradientClassName="from-rose-50 to-rose-100"
          iconClassName="bg-rose-500"
          icon={<BellIcon className="h-[18px] w-[18px] text-white" />}
          title={t('babies.dashboard.previewNotifications.cardTitle')}
          titleClassName="text-rose-900"
          subtitle={t('babies.dashboard.previewNotifications.cardSubtitle')}
          subtitleClassName="text-rose-600"
        >
          <div className="flex flex-col gap-2">
            {notificationItems.map((item, index) => (
              <div key={index} className="flex items-center gap-2.5 rounded-lg bg-rose-50/60 px-2.5 py-2">
                <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-rose-500" />
                <p className="flex-1 text-xs text-ink">{item.text}</p>
              </div>
            ))}
            <p className="mt-0.5 text-[11px] text-ink-faint">{t('babies.dashboard.previewNotifications.footerNote')}</p>
          </div>
        </PreviewCard>
      </div>

      {/* Steps */}
      <div className="mb-7 rounded-3xl bg-card p-7 shadow-[0_2px_12px_rgba(0,0,0,0.04)] sm:p-8">
        <p className="font-display mb-5 text-center text-base font-extrabold text-ink">
          {t('babies.dashboard.stepsSectionTitle')}
        </p>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
          {steps.map((step, index) => {
            const StepIcon = STEP_ICONS[index] ?? PlusIcon
            return (
              <Fragment key={index}>
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-400 shadow-md shadow-teal-900/20">
                    <StepIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="mx-auto mb-2 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-teal-50">
                    <span className="text-[11px] font-extrabold text-teal-700">{index + 1}</span>
                  </div>
                  <p className="font-display mb-1 text-sm font-extrabold text-ink">{step.title}</p>
                  <p className="text-xs leading-relaxed text-ink-muted">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <span className="hidden text-2xl text-teal-100 sm:block" aria-hidden="true">
                    →
                  </span>
                )}
              </Fragment>
            )
          })}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="flex flex-col items-start justify-between gap-5 rounded-2xl bg-gradient-to-br from-amber-50 to-rose-50 p-6 sm:flex-row sm:items-center">
        <div>
          <p className="font-display mb-1 text-base font-extrabold text-ink">{t('babies.dashboard.bottomCtaTitle')}</p>
          <p className="text-[13px] text-ink-muted">{t('babies.dashboard.bottomCtaDescription')}</p>
        </div>
        <button
          type="button"
          onClick={openAddBabyDialog}
          className="inline-flex flex-shrink-0 items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 font-display text-sm font-extrabold text-amber-950 shadow-lg shadow-amber-900/20 transition-transform hover:-translate-y-0.5"
        >
          <PlusIcon className="h-4 w-4" />
          {t('babies.dashboard.bottomCtaAction')}
        </button>
      </div>
    </div>
  )
}

interface PreviewCardProps {
  gradientClassName: string
  iconClassName: string
  icon: ReactNode
  title: string
  titleClassName: string
  subtitle: string
  subtitleClassName: string
  children: ReactNode
}

function PreviewCard({
  gradientClassName,
  iconClassName,
  icon,
  title,
  titleClassName,
  subtitle,
  subtitleClassName,
  children,
}: PreviewCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl bg-card shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
      <div className={cn('flex items-center gap-2.5 bg-gradient-to-br px-5 py-4', gradientClassName)}>
        <div className={cn('flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px]', iconClassName)}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className={cn('font-display truncate text-[15px] font-extrabold', titleClassName)}>{title}</p>
          <p className={cn('truncate text-[11px] font-semibold', subtitleClassName)}>{subtitle}</p>
        </div>
      </div>
      <div className="p-5 pt-3.5">{children}</div>
    </div>
  )
}
