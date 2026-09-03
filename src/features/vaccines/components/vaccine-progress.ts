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
  /**
   * O denominador da barra, e `applied + pending + delayed` fecha com ele
   * exatamente — é o que permite ao cartão mostrar as três legendas sob o
   * total sem que a conta pareça errada.
   */
  total: number
  /** 0–100, já arredondado. Zero quando não há dose de rotina alguma. */
  percent: number
}

/**
 * O progresso do calendário, contado sobre as doses que a família de fato pode
 * completar: **rotina e que não sejam orientação**.
 *
 * `recommendationKind` e `status` são eixos separados, e é preciso filtrar os
 * dois. `GUIDANCE` é orientação clínica e **nunca completa**; deixá-la no
 * denominador dá uma barra que não chega a 100% por construção — a família fica
 * devendo para sempre uma dose que ninguém deveria tomar sem indicação.
 *
 * **Filtrar só por `ROUTINE` não basta, e isso foi medido, não deduzido.** Num
 * calendário real de três crianças (03/09/2026) as combinações eram:
 *
 *     ROUTINE / APPLIED        40      CONDITIONAL / APPLIED     2
 *     ROUTINE / PENDING        52      CONDITIONAL / GUIDANCE    4
 *     ROUTINE / GUIDANCE        1      RECURRING  / GUIDANCE     3
 *
 * Aquele único `ROUTINE / GUIDANCE` — "Febre amarela, situação excepcional" — é
 * o que fazia a legenda não fechar: 40 + 52 + 0 dava 92 sob um denominador de
 * 93, e uma legenda que não soma o próprio total lê-se como conta errada.
 *
 * Consequência que precisa aparecer na tela, e não só aqui: este `applied` é
 * menor que o "{{applied}} tomadas" do subtítulo da página, que conta o
 * calendário inteiro — os dois `CONDITIONAL / APPLIED` acima entram lá e não
 * aqui, 42 contra 40. Por isso quem exibe este número tem de dizer de que
 * universo ele é: dois números diferentes para a mesma palavra, sem denominador
 * à vista, leem-se como defeito.
 */
export function vaccineProgress(items: ProgressInput[]): VaccineProgress {
  const routine = items.filter((item) => item.recommendationKind === 'ROUTINE' && item.status !== 'GUIDANCE')
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
