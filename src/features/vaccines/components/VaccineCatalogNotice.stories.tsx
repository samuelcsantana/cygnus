import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'

import type { VaccineCatalogMetadata } from '../api/vaccines.schemas'

import { VaccineCatalogNotice } from './VaccineCatalogNotice'

const METADATA: VaccineCatalogMetadata = {
  version: '2026.1',
  sourceName: 'Calendário Nacional de Vacinação',
  sourceOrganization: 'Ministério da Saúde',
  sourceUrl: 'https://www.gov.br/saude/pt-br/vacinacao/calendario',
  sourceUpdatedAt: '2026-01-15',
  effectiveFrom: '2026-01-01',
  minimumAgeInMonths: 0,
  maximumAgeInMonths: 228,
}

const meta = {
  title: 'Features/VaccineCatalogNotice',
  component: VaccineCatalogNotice,
  parameters: {
    docs: {
      description: {
        component:
          'Names the source behind the vaccine calendar and links to it. This app tells parents ' +
          'when a dose is due, which is close enough to health advice that the provenance has to be ' +
          'on screen rather than implied — the disclaimer and the link to the official calendar are ' +
          'the point of the component, not decoration.\n\n' +
          'It is the only place using the `sky` family, which is outside the brand palette and ' +
          'therefore falls through to stock Tailwind. The 700/800/900 steps used here clear AA ' +
          'against the tinted background (5.6:1 to 9.1:1).',
      },
    },
  },
  args: { metadata: METADATA },
} satisfies Meta<typeof VaccineCatalogNotice>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <VaccineCatalogNotice {...args} className="max-w-xl" />,
}

export const SourceLink: Story = {
  name: 'Interaction — the source link is real',
  render: Default.render,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const link = canvas.getByRole('link')

    await expect(link).toHaveAttribute('href', METADATA.sourceUrl)
    // Opening in a new tab without `rel="noreferrer"` leaks the referrer and
    // hands the target page a window handle back to this one.
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', 'noreferrer')
  },
}
