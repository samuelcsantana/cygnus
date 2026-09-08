import { useState, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within, userEvent, waitFor, fn } from 'storybook/test'
import { ThemeContext, type ThemeMode } from '@/app/providers/theme-context'
import { AccountMenu } from './AccountMenu'

function Preferences({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>('system')
  return (
    <ThemeContext.Provider
      value={{ theme, setTheme, resolvedTheme: theme === 'dark' ? 'dark' : 'light' }}
    >
      {children}
    </ThemeContext.Provider>
  )
}
const meta = {
  title: 'Shared/AccountMenu',
  component: AccountMenu,
  args: { name: 'Ana Andrade', email: 'ana@example.com', onLogout: fn(), onNavigate: fn() },
  decorators: [
    (Story) => (
      <Preferences>
        <div style={{ width: 250, marginLeft: 'auto' }}>
          <Story />
        </div>
      </Preferences>
    ),
  ],
} satisfies Meta<typeof AccountMenu>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(body.getByRole('button', { name: 'Conta e preferências' }))
    const dialog = await body.findByRole('dialog', { name: 'Conta e preferências' })
    await waitFor(() => expect(dialog).toBeVisible())
    expect(within(dialog).getByText('ana@example.com')).toBeVisible()
    expect(within(dialog).getByRole('radio', { name: 'Sistema' })).toBeChecked()
    await userEvent.click(within(dialog).getByRole('radio', { name: 'Claro' }))
    await userEvent.keyboard('{ArrowRight}')
    expect(within(dialog).getByRole('radio', { name: 'Escuro' })).toBeChecked()
    await userEvent.click(within(dialog).getByRole('combobox', { name: 'Idioma' }))
    await waitFor(() => expect(body.getByRole('option', { name: 'English' })).toBeVisible())
    await userEvent.keyboard('{Escape}')
    await waitFor(() =>
      expect(within(dialog).getByRole('combobox', { name: 'Idioma' })).toHaveFocus(),
    )
    expect(dialog).toBeVisible()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument())
    await waitFor(() =>
      expect(body.getByRole('button', { name: 'Conta e preferências' })).toHaveFocus(),
    )
    await userEvent.click(body.getByRole('button', { name: 'Conta e preferências' }))
  },
}
export const Dark: Story = {
  globals: { theme: 'dark' },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(body.getByRole('button', { name: 'Conta e preferências' }))
    await waitFor(() => expect(body.getByRole('dialog')).toBeVisible())
  },
}
export const Pending: Story = {
  args: { pending: true },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(body.getByRole('button', { name: 'Conta e preferências' }))
    await waitFor(() => expect(body.getByRole('button', { name: 'Saindo…' })).toBeVisible())
    expect(body.getByRole('button', { name: 'Saindo…' })).toBeDisabled()
  },
}
export const LongIdentity: Story = {
  args: {
    name: 'Ana Maria Andrade de Albuquerque',
    email: 'ana.andrade.albuquerque@example.com',
    avatarUrl: 'data:image/png;base64,broken',
  },
  play: Dark.play,
}
export const ProfileNavigation: Story = {
  play: async ({ canvasElement, args }) => {
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(body.getByRole('button', { name: 'Conta e preferências' }))
    await userEvent.click(await body.findByRole('link', { name: 'Meu perfil' }))
    expect(args.onNavigate).toHaveBeenCalled()
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument())
  },
}
