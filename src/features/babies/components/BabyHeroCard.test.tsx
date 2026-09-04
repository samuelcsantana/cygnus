import { describe, expect, it } from 'vitest'

import type { Baby } from '@/features/babies/api/babies.schemas'
import type { Appointment } from '@/features/appointments/api/appointments.schemas'
import { buildAppointment } from '@/test/fixtures/appointment'
import { buildBaby } from '@/test/fixtures/baby'
import { renderWithProviders, screen } from '@/test/test-utils'

import { BabyHeroCard } from './BabyHeroCard'

const baby = buildBaby({ name: 'Ana', birthDate: '2026-06-01' })

const UP_TO_DATE = 'Vacinas em dia'

function render(
  overrides: Partial<Baby> = {},
  state: { delayed?: number; known?: boolean; measured?: Appointment | null } = {},
) {
  return renderWithProviders(
    <BabyHeroCard
      baby={{ ...baby, ...overrides }}
      delayedVaccineCount={state.delayed ?? 0}
      vaccineStatusKnown={state.known ?? true}
      latestMeasuredVisit={state.measured ?? null}
      onEdit={() => {}}
    />,
  )
}

/**
 * O cartão resume o estado de vacinação de uma criança em três palavras, e a
 * pessoa que lê decide se precisa agir.
 *
 * O caso perigoso não é o erro visível — é o silêncio: quando o calendário não
 * carrega, a contagem de atrasadas é zero **pelo mesmo motivo que seria zero se
 * estivesse tudo em dia**. Sem separar "nenhuma atrasada" de "não sei", o app
 * afirma que a criança está protegida sem ter olhado. Num app de calendário
 * vacinal isso é pior do que não mostrar nada.
 *
 * Herdado da `FamilyStrip`, que estes casos cobriam antes de o painel passar a
 * usar o hero. A garantia é da informação, não do componente, então ela migrou
 * junto — a strip segue viva em /vaccines com os mesmos três casos.
 */
describe('BabyHeroCard: o que o cartão afirma sobre vacinas', () => {
  it('não diz "em dia" quando o calendário não carregou', () => {
    render({}, { delayed: 0, known: false })

    expect(screen.queryByText(UP_TO_DATE)).not.toBeInTheDocument()
    expect(screen.getByText('Não foi possível verificar as vacinas')).toBeInTheDocument()
  })

  it('diz "em dia" quando o calendário carregou e não há atrasadas', () => {
    render({}, { delayed: 0, known: true })

    expect(screen.getByText(UP_TO_DATE)).toBeInTheDocument()
  })

  /**
   * A asserção casa a frase inteira, não o número solto: o cartão também
   * imprime a idade, e `getByText(/3/)` já quebrou sozinha uma vez quando a
   * fixture completou 3 meses — dois elementos casavam e o testing-library
   * reprova por ambiguidade, não por conteúdo errado.
   */
  it('reporta o atraso conhecido, que é verdadeiro sempre que existe', () => {
    render({}, { delayed: 3, known: true })

    expect(screen.getByText('3 vacinas atrasadas')).toBeInTheDocument()
    expect(screen.queryByText(UP_TO_DATE)).not.toBeInTheDocument()
  })
})

/**
 * `allergies` e `bloodType` eram coletados no cadastro e não apareciam em
 * lugar nenhum depois — este cartão é o primeiro lugar da interface que os
 * mostra. Os testes existem para que continuem visíveis: um campo que só o
 * formulário conhece volta a ser invisível sem que nada reprove.
 */
describe('BabyHeroCard: os dados de saúde que só existiam no formulário', () => {
  it('mostra as alergias registradas', () => {
    render({ allergies: ['amoxicilina', 'leite'] })

    expect(screen.getByText('Alergias: amoxicilina, leite')).toBeInTheDocument()
  })

  it('usa o singular com uma alergia só', () => {
    render({ allergies: ['amoxicilina'] })

    expect(screen.getByText('Alergia: amoxicilina')).toBeInTheDocument()
  })

  /**
   * Sem alergia registrada o cartão **afirma o registro vazio** em vez de
   * calar. Silêncio aqui seria lido como "não tem alergia", que é uma
   * conclusão que ninguém verificou — a mesma distinção que
   * `vaccineStatusKnown` faz acima.
   */
  it('diz que não há registro, e não que não há alergia', () => {
    render({ allergies: [] })

    expect(screen.getByText('Nenhuma alergia registrada')).toBeInTheDocument()
  })

  it('mostra o tipo sanguíneo quando existe', () => {
    render({ bloodType: 'A+' })

    expect(screen.getByText('Tipo A+')).toBeInTheDocument()
  })

  /**
   * `bloodType` é anulável no schema, e um "Tipo —" não informa nada: sem o
   * dado, a linha simplesmente não ganha a segunda metade.
   */
  it('omite o tipo sanguíneo quando não foi informado', () => {
    render({ bloodType: null })

    expect(screen.queryByText(/^Tipo /)).not.toBeInTheDocument()
  })

  /**
   * O plano de saúde é a exceção à regra da alergia, e de propósito: sem dado,
   * a linha some em vez de afirmar o vazio. Silêncio sobre alergia seria lido
   * como "não tem"; silêncio sobre plano não afirma nada, e o cartão é curto
   * de propósito porque se repete uma vez por filho.
   */
  it('mostra plano e carteirinha quando existem, e some quando não', () => {
    const { unmount } = render({ healthPlanName: 'Unimed', healthPlanNumber: '0123 4567 8901' })

    expect(screen.getByText('Plano Unimed')).toBeInTheDocument()
    expect(screen.getByText('0123 4567 8901')).toBeInTheDocument()
    expect(screen.getByText('Carteirinha')).toHaveClass('sr-only')

    unmount()
    render({ healthPlanName: null, healthPlanNumber: null })

    expect(screen.queryByText(/^Plano /)).not.toBeInTheDocument()
    expect(screen.queryByText('Carteirinha')).not.toBeInTheDocument()
  })

  /**
   * Peso e altura moram na consulta, e o cartão os traz de volta **com a data**.
   *
   * A data é o ponto: foi por não haver data que guardar a medida no perfil foi
   * descartado. Um peso de março exibido sem quando é lido como o de hoje, que
   * é exatamente o dado que envelhece calado.
   */
  it('mostra a última medida com a data em que foi tomada', () => {
    render(
      {},
      {
        measured: buildAppointment({
          status: 'COMPLETED',
          scheduledAt: '2026-03-12T10:00:00.000Z',
          weightGrams: 15800,
          heightMillimeters: 1000,
        }),
      },
    )

    expect(screen.getByText('15,8 kg')).toBeInTheDocument()
    expect(screen.getByText('100 cm')).toBeInTheDocument()
    expect(screen.getByText('12/03/2026')).toBeInTheDocument()
  })

  it('não mostra linha de medida quando nenhuma consulta mediu nada', () => {
    render({}, { measured: null })

    expect(screen.queryByText(/kg$/)).not.toBeInTheDocument()
    expect(screen.queryByText(/cm$/)).not.toBeInTheDocument()
  })

  /**
   * Só o número, sem o nome do plano: aí o rótulo precisa ficar **visível**,
   * porque um número solto sob um ícone não se explica para quem vê. Com o nome
   * na frente o contexto basta e o rótulo recua para o leitor de tela — este
   * teste é o que trava a regra nos dois sentidos.
   */
  it('rotula a carteirinha em texto visível quando não há nome de plano', () => {
    render({ healthPlanName: null, healthPlanNumber: '0123 4567 8901' })

    expect(screen.getByText('Carteirinha')).not.toHaveClass('sr-only')
  })
})
