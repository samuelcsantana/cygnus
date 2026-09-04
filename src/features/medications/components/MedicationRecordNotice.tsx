import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

interface MedicationRecordNoticeProps {
  className?: string
}

/**
 * O aviso que precisa ser mais firme que o do catálogo de vacinas, e por um motivo concreto.
 *
 * Tudo o mais neste app registra o passado: a vacina foi aplicada, o marco aconteceu. Medicamento
 * é a primeira coisa aqui que descreve algo **em curso**, e "5 gotas, 1× ao dia" lido numa tela é
 * indistinguível de uma instrução se ninguém disser o contrário. Esta tela guarda o que **foi
 * prescrito**; ela não recomenda, não lembra e não sabe se a criança tomou.
 *
 * Fica no topo da rota e dentro do diálogo de registro — nos dois lugares onde alguém pode ler um
 * número e agir. Repetição aqui é barata; a leitura errada não é.
 *
 * A família `sky` é a mesma do `VaccineCatalogNotice` de propósito: no app inteiro, esta cor
 * significa "isto é uma nota de procedência, não um estado da criança". Os passos 700/800/900
 * sobre o fundo tingido medem entre 5.6:1 e 9.1:1.
 */
export function MedicationRecordNotice({ className }: MedicationRecordNoticeProps) {
  const { t } = useTranslation()

  return (
    <aside
      className={cn(
        'rounded-2xl border border-sky-100 bg-sky-50/70 p-4 text-sm dark:border-sky-900/60 dark:bg-sky-950/40',
        className,
      )}
    >
      <p className="font-bold text-sky-900 dark:text-sky-200">{t('medications.notice.title')}</p>
      <p className="mt-1 text-sky-800 dark:text-sky-300">{t('medications.notice.body')}</p>
    </aside>
  )
}
