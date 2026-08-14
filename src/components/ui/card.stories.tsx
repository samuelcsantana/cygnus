import type { Meta, StoryObj } from '@storybook/react-vite'

import { Badge } from './badge'
import { Button } from './button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card'
import { Skeleton } from './skeleton'

const meta = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    docs: {
      description: {
        component:
          'The surface every list item and overview panel is built on. Spacing is driven by the ' +
          '`--card-spacing` custom property rather than per-slot padding, so `size="sm"` restyles ' +
          'the whole composition at once instead of needing overrides on each child.',
      },
    },
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['default', 'sm'] },
  },
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <Card {...args} className="max-w-sm">
      <CardHeader>
        <CardTitle>Próxima consulta</CardTitle>
        <CardDescription>Pediatra — Dra. Helena Marques</CardDescription>
        <CardAction>
          <Badge className="bg-violet-50 text-violet-700">Em 3 dias</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="text-ink-muted">
        Terça, 18 de março, às 14h30 — Clínica Vida, Sala 12.
      </CardContent>
      <CardFooter className="gap-2">
        <Button size="sm">Ver detalhes</Button>
        <Button size="sm" variant="outline">
          Remarcar
        </Button>
      </CardFooter>
    </Card>
  ),
}

export const Compact: Story = {
  name: 'Compact (size="sm")',
  args: { size: 'sm' },
  render: (args) => (
    <Card {...args} className="max-w-sm">
      <CardHeader>
        <CardTitle>Vitamina D</CardTitle>
        <CardDescription>Dose diária — 400 UI</CardDescription>
      </CardHeader>
      <CardContent className="text-ink-muted">Última aplicação registrada hoje, 08h10.</CardContent>
    </Card>
  ),
}

export const Loading: Story = {
  name: 'Loading (skeleton)',
  parameters: {
    docs: {
      description: {
        story:
          'The loading state reuses the card shell so the layout does not jump when data arrives. ' +
          'Every list screen in the app has a distinct skeleton, error and empty state — they are ' +
          'never collapsed into one generic spinner.',
      },
    },
  },
  render: (args) => (
    <Card {...args} className="max-w-sm">
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-56" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
    </Card>
  ),
}

export const ErrorState: Story = {
  name: 'Error',
  render: (args) => (
    <Card {...args} className="max-w-sm">
      <CardHeader>
        <CardTitle>Consultas</CardTitle>
        <CardDescription className="text-rose-600">
          Não foi possível carregar as consultas.
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button size="sm" variant="outline">
          Tentar novamente
        </Button>
      </CardFooter>
    </Card>
  ),
}
