import type { Meta, StoryObj } from '@storybook/react-vite'
import { BrandMark } from './BrandMark'

const meta = { title: 'Brand/Mark', component: BrandMark } satisfies Meta<typeof BrandMark>
export default meta
type Story = StoryObj<typeof meta>

/** The sizes the app actually uses, from the 24px dialog header to the 64px error screens. */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-5">
      {['size-6', 'size-8', 'size-10', 'size-11', 'size-12', 'size-16'].map((size) => (
        <BrandMark key={size} className={size} />
      ))}
    </div>
  ),
}

/** The browser tab: the smallest place the mark has to survive. */
export const Favicon: Story = { args: { className: 'size-4' } }

export const OnDarkPanel: Story = {
  args: { className: 'size-12 rounded-[22.5%] ring-1 ring-white/20' },
  decorators: [(Story) => <div className="rounded-2xl bg-emerald-900 p-6"><Story /></div>],
}
