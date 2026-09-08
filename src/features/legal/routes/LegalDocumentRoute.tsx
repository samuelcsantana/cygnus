import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { BINDING_LOCALE, legalContent } from '@/features/legal/content'
import { AlertCircleIcon } from '@/shared/icons/alert-circle-icon'
import { LogoIcon } from '@/shared/icons/logo-icon'
import { LEGAL_DOCUMENTS, type LegalDocumentId } from '@/shared/legal'
import { formatDateDisplay } from '@/lib/date'

interface LegalDocumentRouteProps {
  documentId: LegalDocumentId
}

/** Public legal documents retain their draft notice until reviewed and activated. */
export function LegalDocumentRoute({ documentId }: LegalDocumentRouteProps) {
  const { t, i18n } = useTranslation()
  const doc = LEGAL_DOCUMENTS[documentId]
  const outro = documentId === 'privacy' ? LEGAL_DOCUMENTS.terms : LEGAL_DOCUMENTS.privacy
  const conteudo = legalContent(documentId)
  const outroIdioma = !i18n.language.startsWith(BINDING_LOCALE.slice(0, 2))

  return (
    /* `<main>` e não `<div>`: estas são as únicas telas do app que desenham a
       própria página sem passar por um layout, e ficaram sem landmark
       principal. Quem navega por landmarks não tinha como pular direto para o
       documento — que é a única coisa que a página tem. */
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-10 sm:px-8">
      <Link to="/" className="text-ink-muted hover:text-ink inline-flex items-center gap-2 text-sm font-semibold">
        <span className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg">
          <LogoIcon className="h-4 w-4" />
        </span>
        {t('common.appName')}
      </Link>

      <h1 className="font-display mt-8 text-3xl font-extrabold text-ink">{t(`legal.${documentId}.title`)}</h1>
      <p className="text-ink-muted mt-1 text-sm">
        {doc.status === 'draft'
          ? t('legal.draftVersionLine', { version: doc.version })
          : t('legal.versionLine', { version: doc.version, date: formatDateDisplay(doc.effectiveFrom, i18n.language) })}
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



      {/* O documento em si. O texto vem de `features/legal/content`, não das
          chaves de i18n: ele é artefato versionado, e a substituição pela versão
          revisada tem de ser um arquivo só. Ver o cabeçalho daqueles arquivos. */}
      {outroIdioma && (
        <p className="text-ink-muted border-border mt-6 rounded-2xl border border-dashed p-4 text-sm">
          {t('legal.bindingLocaleNotice')}
        </p>
      )}

      <div className="mt-8 space-y-8">
        {conteudo.sections.map((secao) => (
          <section key={secao.id} id={secao.id}>
            <h2 className="font-display text-xl font-bold text-ink">{secao.heading}</h2>
            {secao.needsReview && (
              /* Marcado seção a seção, e não só no topo da página: uma política
                 meio pronta que parece pronta é pior que uma ausente, e quem
                 chega direto num link de âncora não vê o aviso do topo. */
              <p className="text-amber-700 dark:text-amber-300 mt-2 text-sm font-semibold">
                {t('legal.sectionNeedsReview')}
              </p>
            )}
            <div className="text-ink-muted mt-3 space-y-3 text-sm leading-relaxed">
              {secao.body.map((paragrafo) => (
                <p key={paragrafo.slice(0, 48)}>{paragrafo}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="text-ink-muted mt-10 text-sm">
        <Link to={outro.path} className="text-primary font-semibold underline-offset-4 hover:underline">
          {t(`legal.${outro.id}.title`)}
        </Link>
      </p>
    </main>
  )
}
