import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { LogoIcon } from '@/shared/icons/logo-icon'

import { documentsAwaitingAcceptance, useLegalAcceptances, useRecordLegalAcceptance } from '../api/legal.hooks'

/**
 * Stands between a signed-in person and the app until they have accepted every
 * document that is in force.
 *
 * **It is inert today, and that is the design, not an unfinished state.** Both
 * documents are drafts (`shared/legal.ts`), so `documentsInForce()` is empty,
 * the query never fires and this renders its children untouched. The day a
 * reviewed text lands and its `status` flips to `'in-force'`, the gate starts
 * asking on its own — no other file has to change. That is what "ready to be
 * swapped" has to mean to be worth anything.
 *
 * Why a gate rather than a checkbox at sign-up: a version bump has to re-ask,
 * and it has to re-ask people who already have accounts. A checkbox on the
 * registration form only ever catches new users, and would leave every existing
 * account agreeing to a text they never saw.
 *
 * It deliberately does **not** offer a way past. There is no "later": the app
 * handles a child's health data, and continuing without consent would be
 * processing it without a basis. The way out is the browser's back button or
 * signing out, which the copy says.
 */
export function LegalAcceptanceGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const acceptances = useLegalAcceptances()
  const record = useRecordLegalAcceptance()

  const pending = documentsAwaitingAcceptance(acceptances.data)

  // While the answer is unknown, the app renders. A network hiccup on this
  // query must not lock somebody out of a health record they already have — the
  // gate exists to collect consent, not to hold data hostage. `isPending` is
  // false when the query is disabled, which is the inert case.
  if (acceptances.isPending || acceptances.isError || pending.length === 0) {
    return <>{children}</>
  }

  return (
    <main className="bg-surface flex min-h-dvh flex-col items-center justify-center px-5 py-10">
      <div className="bg-card border-border/70 w-full max-w-lg rounded-3xl border p-8 shadow-xl">
        <span className="bg-primary text-primary-foreground flex h-11 w-11 items-center justify-center rounded-xl">
          <LogoIcon className="h-6 w-6" />
        </span>

        <h1 className="font-display text-ink mt-6 text-2xl font-extrabold">{t('legal.gate.title')}</h1>
        <p className="text-ink-muted mt-2 text-sm leading-relaxed">{t('legal.gate.description')}</p>

        <ul className="mt-6 space-y-3">
          {pending.map((document) => (
            <li key={document.id} className="border-border rounded-2xl border p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Link
                  to={document.path}
                  className="text-primary font-semibold underline-offset-4 hover:underline"
                >
                  {t(`legal.${document.id}.title`)}
                </Link>
                <span className="text-ink-faint text-xs">
                  {t('legal.gate.versionLabel', { version: document.version })}
                </span>
              </div>
              <p className="text-ink-muted mt-1 text-xs">{t('legal.gate.readFirst')}</p>
            </li>
          ))}
        </ul>

        {record.isError && (
          <p role="alert" className="text-destructive mt-4 text-sm">
            {t('legal.gate.genericError')}
          </p>
        )}

        <Button
          type="button"
          size="cta"
          className="mt-6 w-full"
          disabled={record.isPending}
          onClick={async () => {
            // One at a time, and sequentially: the API records one document per
            // request, and a failure halfway through must leave the accepted
            // ones accepted. Each is a fact about the past on its own.
            for (const document of pending) {
              await record.mutateAsync(document.id).catch(() => null)
            }
          }}
        >
          {record.isPending ? t('common.saving') : t('legal.gate.acceptAction')}
        </Button>

        <p className="text-ink-faint mt-4 text-center text-xs">{t('legal.gate.noWayAround')}</p>
      </div>
    </main>
  )
}
