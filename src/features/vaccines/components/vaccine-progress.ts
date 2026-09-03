import type { VaccineRecommendationKind, VaccineStatus } from '../api/vaccines.schemas'

/** O mínimo que o cálculo precisa — serve tanto para `VaccineItem` quanto para `VaccineItemWithBaby`. */
interface ProgressInput {
  recommendationKind: VaccineRecommendationKind
  status: VaccineStatus
}

export interface VaccineProgress {
  applied: number
  pending: number
  delayed: number
  /** Doses de rotina consideradas — o denominador da barra. */
  total: number
  /** 0–100, já arredondado. Zero quando não há dose de rotina alguma. */
  percent: number
}

/**
 * O progresso do calendário, contado **apenas sobre as doses de rotina**.
 *
 * `recommendationKind` e `status` são eixos separados: uma dose `CONDITIONAL`
 * ou `RECURRING` costuma chegar como `GUIDANCE`, que é orientação clínica e
 * **nunca completa**. Incluí-las no denominador daria uma barra que não chega a
 * 100% por construção — a família ficaria devendo para sempre uma dose que
 * ninguém deveria tomar sem indicação.
 *
 * Consequência que precisa aparecer na tela, e não só aqui: este `applied` pode
 * ser menor que o "{{applied}} tomadas" do subtítulo da página, que conta o
 * calendário inteiro. Uma dose condicional efetivamente aplicada entra lá e não
 * entra aqui. Por isso quem exibe este número tem de dizer de que universo ele
 * é — dois números diferentes para a mesma palavra, sem denominador à vista,
 * leem-se como defeito.
 */
export function vaccineProgress(items: ProgressInput[]): VaccineProgress {
  const routine = items.filter((item) => item.recommendationKind === 'ROUTINE')
  const applied = routine.filter((item) => item.status === 'APPLIED').length
  const pending = routine.filter((item) => item.status === 'PENDING').length
  const delayed = routine.filter((item) => item.status === 'DELAYED').length

  return {
    applied,
    pending,
    delayed,
    total: routine.length,
    percent: routine.length > 0 ? Math.round((applied / routine.length) * 100) : 0,
  }
}
