import { Heart, Sprout, CalendarDays, Sparkles, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAddBabyDialogStore } from '@/shared/stores/addBabyDialog.store'
export function WelcomeDashboard({ greetingKey }: { greetingKey: string }) {
  const { t } = useTranslation()
  const open = useAddBabyDialogStore((state) => state.open)
  return (
    <div className="space-y-8">
      <section className="grid overflow-hidden rounded-3xl border border-border bg-card lg:grid-cols-[1.5fr_1fr]">
        <div className="p-6 sm:p-10 lg:py-14">
          <p className="mb-4 text-sm font-semibold text-primary">{t(greetingKey)}</p>
          <h1 className="max-w-lg font-display text-3xl font-medium leading-tight text-ink sm:text-4xl">
            {t('babies.home.welcome')}
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-ink-muted">
            {t('babies.home.intro')}
          </p>
          <button
            type="button"
            onClick={open}
            className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground"
          >
            <Plus aria-hidden className="size-5" />
            {t('babies.home.addFirst')}
          </button>
          <p className="mt-3 max-w-md text-sm text-ink-muted">{t('babies.home.later')}</p>
        </div>
        <div
          aria-hidden="true"
          className="relative flex min-h-48 items-center justify-center overflow-hidden bg-emerald-50 p-8 dark:bg-emerald-950/40"
        >
          <div className="absolute size-64 rounded-full border border-primary/10" />
          <div className="absolute size-44 rounded-full bg-primary/5" />
          <div className="relative flex size-28 rotate-[-8deg] items-center justify-center rounded-[2rem] bg-card shadow-sm">
            <Sprout className="size-16 text-primary" />
          </div>
          <Heart className="absolute right-[22%] top-[22%] size-7 rotate-12 text-amber-700 dark:text-amber-300" />
        </div>
      </section>
      <div className="grid gap-5 sm:grid-cols-3">
        {[CalendarDays, Sprout, Sparkles].map((Icon, index) => (
          <section key={index} className="flex items-start gap-3 p-2">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/5 text-primary">
              <Icon aria-hidden className="size-5" />
            </span>
            <div>
              <h2 className="font-semibold text-ink">{t(`babies.home.benefit${index}Title`)}</h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                {t(`babies.home.benefit${index}Body`)}
              </p>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
