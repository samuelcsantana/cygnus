import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'

import { VaccineProgressCard } from './VaccineProgressCard'
import { vaccineProgress } from './vaccine-progress'

const meta = {
  title: 'Features/VaccineProgressCard',
  component: VaccineProgressCard,
  parameters: {
    docs: {
      description: {
        component:
          'The calendar progress bar, with a legend of what the number is made of. Adapted from the ' +
          '`LoginAndDashboardDesign` reference, with one addition: **it states its own denominator**.\n\n' +
          'The vaccines page subtitle counts the whole calendar while this bar counts routine doses ' +
          'only — a conditional dose that was actually given lands in one number and not the other. ' +
          'Without the "of N", the page would show two different values for the same word inches ' +
          'apart, which reads as a bug. See `vaccine-progress.ts` for why the denominator is ' +
          'routine-only.\n\n' +
          'The bar is `aria-hidden` and the state is carried by text: the percentage is already ' +
          'written beside it, so a `progressbar` role would have a screen reader announce the same ' +
          'number twice. Nothing here is interactive or self-updating.',
      },
    },
  },
} satisfies Meta<typeof VaccineProgressCard>

export default meta
type Story = StoryObj<typeof meta>

const render = (args: { progress: ReturnType<typeof vaccineProgress> }) => (
  <div className="max-w-xl">
    <VaccineProgressCard {...args} />
  </div>
)

export const Partial: Story = {
  args: { progress: { applied: 26, pending: 14, delayed: 0, total: 42, percent: 62 } },
  render,
}

/**
 * O estado de quem acabou de cadastrar o primeiro filho. A barra vazia e as três
 * legendas em zero são a leitura correta aqui — não há dado faltando, há
 * calendário inteiro pela frente.
 */
export const JustStarted: Story = {
  name: 'Empty — nothing taken yet',
  args: { progress: { applied: 0, pending: 42, delayed: 0, total: 42, percent: 0 } },
  render,
}

export const Complete: Story = {
  args: { progress: { applied: 42, pending: 0, delayed: 0, total: 42, percent: 100 } },
  render,
}

/**
 * O caso que a legenda existe para mostrar: a barra sozinha diria "83%", que
 * soa bem, e esconderia que sete doses estão atrasadas.
 */
export const WithOverdue: Story = {
  name: 'Overdue doses in the legend',
  args: { progress: { applied: 35, pending: 0, delayed: 7, total: 42, percent: 83 } },
  render,
}

/**
 * Uma família sem nenhuma dose de rotina no universo — só orientações. O
 * denominador é zero, e o cálculo precisa devolver 0% em vez de `NaN%`.
 */
export const NoRoutineDoses: Story = {
  name: 'Edge — no routine doses at all',
  args: { progress: vaccineProgress([{ recommendationKind: 'CONDITIONAL', status: 'GUIDANCE' }]) },
  render,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // A divisão por zero é o bug óbvio aqui, e ele renderiza como "NaN%" sem
    // reprovar nada — nem tipo, nem lint. Esta asserção é o portão.
    await expect(canvas.getByText('0%')).toBeInTheDocument()
    await expect(canvas.queryByText(/NaN/)).not.toBeInTheDocument()
  },
}

export const LegendMatchesTheBar: Story = {
  name: 'Interaction — the legend adds up to the denominator',
  args: WithOverdue.args,
  render,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Tomadas + pendentes + atrasadas têm de fechar com o total anunciado:
    // 35 + 0 + 7 = 42. Uma legenda contada sobre um universo diferente do da
    // barra é pior que legenda nenhuma — foi exatamente o que aconteceu num
    // calendário real, onde uma dose `ROUTINE / GUIDANCE` ficava no
    // denominador e a legenda somava 92 sob um total de 93. O filtro que
    // conserta isso está em `vaccine-progress.ts` e tem teste próprio; aqui
    // fica a garantia de que o cartão mostra os dois lados da conta juntos.
    await expect(canvas.getByText('35 de 42')).toBeInTheDocument()
    await expect(canvas.getByText('83%')).toBeInTheDocument()
    for (const value of ['35', '0', '7']) {
      await expect(canvas.getAllByText(value).length).toBeGreaterThan(0)
    }
  },
}
