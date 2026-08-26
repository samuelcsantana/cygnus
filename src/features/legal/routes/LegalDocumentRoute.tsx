import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { AlertCircleIcon } from '@/shared/icons/alert-circle-icon'
import { LogoIcon } from '@/shared/icons/logo-icon'
import { DATA_CATEGORIES, LEGAL_DOCUMENTS, type LegalDocumentId } from '@/shared/legal'
import { formatDateDisplay } from '@/lib/date'

interface LegalDocumentRouteProps {
  documentId: LegalDocumentId
}

/**
 * Uma rota para os dois documentos: a estrutura é a mesma e só a cópia muda.
 *
 * Pública de propósito — uma política de privacidade que exige login para ser
 * lida não cumpre o que existe para cumprir.
 *
 * **O texto jurídico é placeholder e a página diz isso em cima**, antes de
 * qualquer outra coisa. O que **não** é placeholder é o inventário de dados:
 * aquelas categorias saem dos schemas Zod deste repositório, então descrevem o
 * sistema de verdade. A separação é deliberada — descrever o que o software faz
 * é factual; prometer prazo de retenção e base legal é jurídico, e isso precisa
 * de revisão humana.
 */
export function LegalDocumentRoute({ documentId }: LegalDocumentRouteProps) {
  const { t, i18n } = useTranslation()
  const doc = LEGAL_DOCUMENTS[documentId]
  const outro = documentId === 'privacy' ? LEGAL_DOCUMENTS.terms : LEGAL_DOCUMENTS.privacy

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-5 py-10 sm:px-8">
      <Link to="/" className="text-ink-muted hover:text-ink inline-flex items-center gap-2 text-sm font-semibold">
        <span className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg">
          <LogoIcon className="h-4 w-4" />
        </span>
        {t('common.appName')}
      </Link>

      <h1 className="font-display mt-8 text-3xl font-extrabold text-ink">{t(`legal.${documentId}.title`)}</h1>
      <p className="text-ink-muted mt-1 text-sm">
        {t('legal.versionLine', { version: doc.version, date: formatDateDisplay(doc.effectiveFrom, i18n.language) })}
      </p>

      {doc.status === 'draft' && (
        <div
          role="alert"
          className="border-amber-100 bg-amber-50 dark:bg-amber-950/40 mt-6 flex items-start gap-3 rounded-2xl border p-5"
        >
          <AlertCircleIcon className="text-amber-700 dark:text-amber-300 mt-0.5 h-5 w-5 flex-shrink-0" />
          <div>
            <p className="text-amber-700 dark:text-amber-300 font-bold">{t('legal.draftNotice.title')}</p>
            <p className="text-ink-muted mt-1 text-sm">{t('legal.draftNotice.body')}</p>
          </div>
        </div>
      )}

      <section className="mt-8">
        <h2 className="font-display text-xl font-bold text-ink">{t('legal.inventory.title')}</h2>
        <p className="text-ink-muted mt-1 text-sm">{t('legal.inventory.intro')}</p>
        <dl className="mt-4 space-y-3">
          {DATA_CATEGORIES.map((categoria) => (
            <div key={categoria} className="rounded-2xl bg-card p-4 shadow-sm">
              <dt className="font-semibold text-ink">{t(`legal.inventory.categories.${categoria}.label`)}</dt>
              <dd className="text-ink-muted mt-1 text-sm">{t(`legal.inventory.categories.${categoria}.detail`)}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl font-bold text-ink">{t(`legal.${documentId}.sectionsTitle`)}</h2>
        <p className="text-ink-muted mt-1 text-sm">{t('legal.pendingSections')}</p>
        <ul className="text-ink-muted mt-4 list-disc space-y-2 pl-5 text-sm">
          {(t(`legal.${documentId}.sections`, { returnObjects: true }) as string[]).map((titulo) => (
            <li key={titulo}>{titulo}</li>
          ))}
        </ul>
      </section>

      <p className="text-ink-muted mt-10 text-sm">
        <Link to={outro.path} className="text-primary font-semibold underline-offset-4 hover:underline">
          {t(`legal.${outro.id}.title`)}
        </Link>
      </p>
    </div>
  )
}
