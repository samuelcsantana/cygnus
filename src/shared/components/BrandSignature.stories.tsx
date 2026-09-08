import type { Meta, StoryObj } from '@storybook/react-vite'
import { BrandSignature } from './BrandSignature'

const meta = { title: 'Brand/Signature', component: BrandSignature } satisfies Meta<typeof BrandSignature>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const Compact: Story = { args: { compact: true } }
export const Dark: Story = { globals: { theme: 'dark' } }
export const Inverse: Story = {
  args: { inverse: true },
  decorators: [(Story) => <div className="rounded-2xl bg-emerald-900 p-6"><Story /></div>],
}
