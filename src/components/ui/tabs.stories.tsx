import type { Meta, StoryObj } from '@storybook/react-vite'

import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'

const meta = {
  title: 'UI/Tabs',
  component: Tabs,
  argTypes: {
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
  },
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { defaultValue: 'pending' },
  render: (args) => (
    <Tabs {...args} className="w-96">
      <TabsList>
        <TabsTrigger value="pending">Pendentes</TabsTrigger>
        <TabsTrigger value="applied">Aplicadas</TabsTrigger>
        <TabsTrigger value="delayed">Atrasadas</TabsTrigger>
      </TabsList>
      <TabsContent value="pending" className="text-ink-muted">
        4 vacinas previstas para os próximos 30 dias.
      </TabsContent>
      <TabsContent value="applied" className="text-ink-muted">
        18 doses registradas desde o nascimento.
      </TabsContent>
      <TabsContent value="delayed" className="text-ink-muted">
        1 dose atrasada: Tríplice Viral (2ª dose).
      </TabsContent>
    </Tabs>
  ),
}

export const LineVariant: Story = {
  name: 'Line variant',
  args: { defaultValue: 'pending' },
  render: (args) => (
    <Tabs {...args} className="w-96">
      <TabsList variant="line">
        <TabsTrigger value="pending">Pendentes</TabsTrigger>
        <TabsTrigger value="applied">Aplicadas</TabsTrigger>
      </TabsList>
      <TabsContent value="pending" className="text-ink-muted">
        4 vacinas previstas para os próximos 30 dias.
      </TabsContent>
      <TabsContent value="applied" className="text-ink-muted">
        18 doses registradas desde o nascimento.
      </TabsContent>
    </Tabs>
  ),
}

export const Vertical: Story = {
  args: { defaultValue: 'pending', orientation: 'vertical' },
  render: Default.render,
}
