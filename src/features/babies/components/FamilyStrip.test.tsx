import { describe, expect, it } from 'vitest'

import { buildBaby } from '@/test/fixtures/baby'
import { renderWithProviders, screen } from '@/test/test-utils'

import { FamilyStrip } from './FamilyStrip'

const baby = buildBaby({ name: 'Ana', birthDate: '2026-06-01' })

const UP_TO_DATE = 'Vacinas em dia'

/**
 * O chip resume o estado de vacinação de uma criança em três palavras, e a
 * pessoa que lê decide se precisa agir.
 *
 * O caso perigoso não é o erro visível — é o silêncio: quando o calendário não
 * carrega, a contagem de atrasadas é zero **pelo mesmo motivo que seria zero se
 * estivesse tudo em dia**. Sem separar "nenhuma atrasada" de "não sei", o app
 * afirma que a criança está protegida sem ter olhado. Num app de calendário
 * vacinal isso é pior do que não mostrar nada.
 */
describe('FamilyStrip: o que o chip afirma sobre vacinas', () => {
  it('não diz "em dia" quando o calendário não carregou', () => {
    renderWithProviders(
      <FamilyStrip items={[{ baby, delayedVaccineCount: 0, vaccineStatusKnown: false }]} onEdit={() => {}} />,
    )

    expect(screen.queryByText(UP_TO_DATE)).not.toBeInTheDocument()
    expect(screen.getByText('Não foi possível verificar as vacinas')).toBeInTheDocument()
  })

  it('diz "em dia" quando o calendário carregou e não há atrasadas', () => {
    renderWithProviders(
      <FamilyStrip items={[{ baby, delayedVaccineCount: 0, vaccineStatusKnown: true }]} onEdit={() => {}} />,
    )

    expect(screen.getByText(UP_TO_DATE)).toBeInTheDocument()
  })

  /**
   * A asserção casa a frase inteira, não o número solto.
   *
   * `getByText(/3/)` passou de 27/08 a 31/08/2026 e quebrou sozinha em 01/09,
   * sem ninguém tocar no código: o chip também imprime a idade, a fixture nasceu
   * em 01/06/2026, e nesse dia a criança completou **3 meses**. Dois elementos
   * casaram com `/3/` — "3 meses" e "3 vacinas atrasadas" — e o testing-library
   * reprova por ambiguidade, não por conteúdo errado.
   *
   * O digito sozinho nunca foi o que este teste queria provar. Casar a frase
   * torna a asserção independente do calendário e mais específica: ela agora
   * falha se a pluralização quebrar, o que a versão anterior deixava passar.
   */
  it('reporta o atraso conhecido, que é verdadeiro sempre que existe', () => {
    renderWithProviders(
      <FamilyStrip items={[{ baby, delayedVaccineCount: 3, vaccineStatusKnown: true }]} onEdit={() => {}} />,
    )

    expect(screen.getByText('3 vacinas atrasadas')).toBeInTheDocument()
    expect(screen.queryByText(UP_TO_DATE)).not.toBeInTheDocument()
  })
})
