import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { buildBaby } from '@/test/fixtures/baby'
import { renderWithProviders, screen } from '@/test/test-utils'

import { useSelectedBabyStore } from '../stores/selectedBaby.store'
import { BabySwitcher } from './BabySwitcher'

const ana = buildBaby({ id: '11111111-1111-4111-8111-111111111111', name: 'Ana', birthDate: '2026-01-10' })
const bento = buildBaby({ id: '22222222-2222-4222-8222-222222222222', name: 'Bento', birthDate: '2021-03-02' })

function renderSwitcher() {
  const select = useSelectedBabyStore.getState().select
  const value = useSelectedBabyStore.getState().selectedBabyId
  return renderWithProviders(<BabySwitcher babies={[ana, bento]} value={value} onChange={select} />)
}

beforeEach(() => {
  useSelectedBabyStore.getState().select(null)
})

describe('BabySwitcher', () => {
  /**
   * Um grupo de rádio, e não seis botões: exatamente um é verdadeiro por vez, e
   * é o `aria-checked` que diz isso a quem usa leitor de tela. Botões soltos
   * anunciam seis coisas independentes para apertar.
   */
  it('anuncia qual criança está escolhida, não só a pinta', () => {
    renderSwitcher()

    expect(screen.getByRole('radio', { name: 'Todas as crianças' })).toBeChecked()
    expect(screen.getByRole('radio', { name: /Ana/ })).not.toBeChecked()
  })

  it('escolhe a criança clicada e guarda a escolha fora da tela', async () => {
    const user = userEvent.setup()
    renderSwitcher()

    await user.click(screen.getByRole('radio', { name: /Ana/ }))

    // O store é o que as seis telas leem; sem isto a escolha morreria no menu.
    expect(useSelectedBabyStore.getState().selectedBabyId).toBe(ana.id)
  })

  it('mostra a idade do jeito que se fala, que é o que separa dois nomes na lista', () => {
    renderSwitcher()

    // Ana nasceu em 2026 e Bento em 2021: meses para uma, anos para o outro.
    expect(screen.getByRole('radio', { name: /Ana/ })).toHaveTextContent(/mês|meses|anos/)
    expect(screen.getByRole('radio', { name: /Bento/ })).toHaveTextContent(/anos/)
  })

  it('volta para a família inteira, que é uma escolha e não a ausência de uma', async () => {
    const user = userEvent.setup()
    useSelectedBabyStore.getState().select(bento.id)
    renderSwitcher()

    await user.click(screen.getByRole('radio', { name: 'Todas as crianças' }))

    expect(useSelectedBabyStore.getState().selectedBabyId).toBeNull()
  })
})

describe('selectedBaby store', () => {
  /**
   * A criança pode ser apagada nesta aba ou noutra, e o id sobrevive no
   * localStorage. Sem isto, toda lista filtra por alguém que não existe e o app
   * parece vazio por um motivo que ninguém vê.
   */
  it('descarta a seleção quando a criança não está mais na lista', () => {
    const { select, reconcile } = useSelectedBabyStore.getState()

    select(ana.id)
    reconcile([bento.id])

    expect(useSelectedBabyStore.getState().selectedBabyId).toBeNull()
  })

  it('não mexe numa seleção que continua válida', () => {
    const { select, reconcile } = useSelectedBabyStore.getState()

    select(ana.id)
    reconcile([ana.id, bento.id])

    expect(useSelectedBabyStore.getState().selectedBabyId).toBe(ana.id)
  })
})
