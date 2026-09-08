import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { config } from '@/lib/config'
import i18n from '@/lib/i18n'
import { server } from '@/test/msw/server'
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test/test-utils'
import { MilestonePhotoUploadField } from './MilestonePhotoUploadField'

const file = new File(['photo'], 'photo.png', { type: 'image/png' })
const t = (key: string) => i18n.t(key)
beforeEach(() => {
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview')
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
})
afterEach(() => vi.restoreAllMocks())

describe('milestone photo uploads', () => {
  it.each([
    [new File(['pdf'], 'proof.pdf', { type: 'application/pdf' }), 'milestones.form.photoInvalidType'],
    [new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' }), 'milestones.form.photoTooLarge'],
  ] as const)('rejects invalid files without creating a preview: $0.name', async (invalid, error) => {
    const change = vi.fn()
    const { container } = renderWithProviders(<MilestonePhotoUploadField value="" onValueChange={change} />)
    fireEvent.change(container.querySelector('input')!, { target: { files: [invalid] } })
    expect(await screen.findByRole('alert')).toHaveTextContent(t(error))
    expect(URL.createObjectURL).not.toHaveBeenCalled()
    expect(change).not.toHaveBeenCalled()
  })

  it.each([true, false])('releases the temporary preview after the upload settles (success: %s)', async (success) => {
    server.use(http.post(config.apiBaseUrl + '/uploads/milestone-photos', () => success
      ? HttpResponse.json({ url: 'https://example.com/photo.png' })
      : new HttpResponse(null, { status: 500 })))
    const change = vi.fn()
    const { container } = renderWithProviders(<MilestonePhotoUploadField value="" onValueChange={change} />)
    fireEvent.change(container.querySelector('input')!, { target: { files: [file] } })
    await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview'))
    if (success) expect(change).toHaveBeenCalledWith('https://example.com/photo.png')
    else {
      expect(screen.getByRole('alert')).toHaveTextContent(t('milestones.form.photoUploadError'))
      expect(change).not.toHaveBeenCalled()
    }
  })

  it('keeps a deferred file local until the editor saves and clears it on removal', async () => {
    const staged = vi.fn()
    const change = vi.fn()
    const user = userEvent.setup()
    const { container } = renderWithProviders(<MilestonePhotoUploadField value="" onValueChange={change} onFileChange={staged} />)
    fireEvent.change(container.querySelector('input')!, { target: { files: [file] } })
    expect(staged).toHaveBeenCalledWith(file, 'blob:preview')
    expect(change).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: t('milestones.form.photoRemoveAria') }))
    expect(staged).toHaveBeenLastCalledWith(null, null)
    expect(change).toHaveBeenCalledWith('')
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview')
  })
})
