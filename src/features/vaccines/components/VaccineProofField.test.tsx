import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/lib/i18n'
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test/test-utils'
import { VaccineProofField } from './VaccineProofField'

const t = (key: string) => i18n.t(key)
const image = new File(['image'], 'proof.png', { type: 'image/png' })
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('vaccine proof image processing', () => {
  it.each([
    new File(['pdf'], 'proof.pdf', { type: 'application/pdf' }),
    new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'huge.png', { type: 'image/png' }),
  ])('rejects invalid or oversized files before decoding: $name', async (file) => {
    const decode = vi.fn()
    vi.stubGlobal('createImageBitmap', decode)
    const change = vi.fn()
    renderWithProviders(<VaccineProofField value="" onChange={change} />)
    fireEvent.change(screen.getByLabelText(t('vaccines.editor.choosePhoto')), { target: { files: [file] } })
    expect(await screen.findByRole('alert')).toHaveTextContent(t('vaccines.editor.proofError'))
    expect(decode).not.toHaveBeenCalled()
    expect(change).not.toHaveBeenCalled()
  })

  it.each([true, false])('bounds the processed image and releases resources (encoding succeeds: %s)', async (success) => {
    const bitmap = { width: 3200, height: 1600, close: vi.fn() }
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(bitmap))
    const drawImage = vi.fn()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      fillRect: vi.fn(), drawImage, fillStyle: '',
    } as unknown as CanvasRenderingContext2D)
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(success ? 'data:image/jpeg;base64,proof' : 'x'.repeat(700001))
    const change = vi.fn()
    const busy = vi.fn()
    renderWithProviders(<VaccineProofField value="" onChange={change} onProcessingChange={busy} />)
    fireEvent.change(screen.getByLabelText(t('vaccines.editor.choosePhoto')), { target: { files: [image] } })
    await waitFor(() => expect(busy).toHaveBeenLastCalledWith(false))
    expect(busy).toHaveBeenNthCalledWith(1, true)
    expect(drawImage).toHaveBeenCalledWith(bitmap, 0, 0, 1600, 800)
    expect(bitmap.close).toHaveBeenCalledOnce()
    if (success) expect(change).toHaveBeenCalledWith('data:image/jpeg;base64,proof')
    else {
      expect(change).not.toHaveBeenCalled()
      expect(screen.getByRole('alert')).toHaveTextContent(t('vaccines.editor.proofError'))
    }
  })

  it('recovers from an unreadable image and allows the existing proof to be removed', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('Corrupt image')))
    const change = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(<VaccineProofField value="https://example.com/proof.jpg" onChange={change} />)
    fireEvent.change(screen.getByLabelText(t('vaccines.editor.choosePhoto')), { target: { files: [image] } })
    expect(await screen.findByRole('alert')).toBeVisible()
    await user.click(screen.getByRole('button', { name: t('vaccines.editor.removePhoto') }))
    expect(change).toHaveBeenCalledWith('')
  })
})
