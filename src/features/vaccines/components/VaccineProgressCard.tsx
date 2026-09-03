import { useTranslation } from 'react-i18next'

import type { VaccineProgress } from './vaccine-progress'

interface VaccineProgressCardProps {
  progress: VaccineProgress
}

/**
 * A barra de progresso do calendário, com a legenda do que compõe o número.
 *
 * Adaptado da referência `LoginAndDashboardDesign`, que resume o calendário
 * numa barra e três legendas com bolinha. O que mudou na adaptação foi o
 * denominador: **este cartão diz de quantas doses está falando.**
 *
 * Isso não é zelo gratuito. O subtítulo desta mesma página conta o calendário
 * inteiro ("42 tomadas"), e a barra conta só as doses de rotina — uma dose
 * condicional aplicada entra num número e não no outro (o porquê está em
 * `vaccine-progress.ts`). Sem o "de N", a página mostraria dois valores
 * diferentes para a mesma palavra a dois centímetros de distância, e a leitura
 * natural disso é "um dos dois está errado". Com o denominador à vista, os dois
 * números passam a ser respostas a perguntas diferentes.
 *
 * A barra é `aria-hidden` e o estado vai por texto: a porcentagem já está
 * escrita ao lado, e um `progressbar` com `aria-valuenow` faria leitor de tela
 * anunciar o mesmo número duas vezes. Nada aqui é interativo nem muda sozinho —
 * não é uma barra de carregamento, é um gráfico de um valor que o texto já dá.
 */
export function VaccineProgressCard({ progress }: VaccineProgressCardProps) {
  const { t } = useTranslation()

  // As três chaves escritas por extenso, e não montadas com
  // `` t(`…legend.${key}`) ``: o `audit-locale-parity.mjs` lê `t('…')`
  // estaticamente e só cobre o que consegue ver. Uma chave montada em runtime
  // cai na lista de "conferir a olho", que é onde uma tradução faltando passa.
  const legend = [
    { key: 'applied', label: t('vaccines.progressLegend.applied'), value: progress.applied, dotClass: 'bg-emerald-500' },
    { key: 'pending', label: t('vaccines.progressLegend.pending'), value: progress.pending, dotClass: 'bg-amber-400' },
    { key: 'delayed', label: t('vaccines.progressLegend.delayed'), value: progress.delayed, dotClass: 'bg-rose-400' },
  ] as const

  return (
    <div className="rounded-2xl bg-card p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="text-[13px] font-semibold text-ink">{t('vaccines.progressLabel')}</span>
        {/* Contagem e porcentagem em mono, como todo dado factual. O "de N" é o
            denominador que a nota do componente explica. */}
        <span className="font-mono text-[13px] text-ink-muted">
          {/* Cada valor no seu próprio elemento, e não dois text nodes soltos
              separados por um "·". Como irmãos soltos, "26 de 42" não é o texto
              de elemento nenhum — o pai contém "26 de 42 · 62%" — e nem teste
              nem leitor de tela conseguem tratar os dois como unidades. */}
          <span>{t('vaccines.progressCount', { applied: progress.applied, total: progress.total })}</span>
          {' · '}
          <span className="text-primary">{progress.percent}%</span>
        </span>
      </div>

      <div aria-hidden className="h-3 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
          style={{ width: `${progress.percent}%` }}
        />
      </div>

      {/* A legenda existe para dizer de que é feito o resto da barra, então as
          três entradas aparecem mesmo em zero: esconder "atrasadas: 0" tiraria
          justamente a informação boa — que não há nenhuma. */}
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
        {legend.map(({ key, label, value, dotClass }) => (
          <li key={key} className="flex items-center gap-2 text-xs text-ink-muted">
            <span aria-hidden className={`h-2 w-2 flex-shrink-0 rounded-full ${dotClass}`} />
            {label}
            {': '}
            <span className="font-mono text-ink">{value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
