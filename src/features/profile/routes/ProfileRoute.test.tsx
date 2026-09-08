import { ThemeContext } from '@/app/providers/theme-context'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { expect, it } from 'vitest'
import { config } from '@/lib/config'
import { server } from '@/test/msw/server'
import { renderWithProviders, screen } from '@/test/test-utils'
import { ProfileRoute } from './ProfileRoute'
it('shows a retry instead of a blank profile after a loading failure', async () => {
  let failed = true
  server.use(
    http.get(`${config.apiBaseUrl}/auth/me`, () =>
      failed
        ? new HttpResponse(null, { status: 500 })
        : HttpResponse.json({
            id: '11111111-1111-4111-8111-111111111111',
            name: 'Alice',
            email: 'alice@example.com',
            createdAt: '2026-01-01',
            avatarUrl: null,
          }),
    ),
  )
  renderWithProviders(
    <MemoryRouter>
      <ThemeContext.Provider
        value={{ theme: 'system', resolvedTheme: 'light', setTheme: () => {} }}
      >
        <ProfileRoute />
      </ThemeContext.Provider>
    </MemoryRouter>,
  )
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Não foi possível carregar seu perfil.',
  )
  failed = false
  await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
  expect(await screen.findByLabelText('Nome completo')).toHaveValue('Alice')
})
