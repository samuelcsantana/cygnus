import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { ApiError } from './http-client'
import { queryClient, setRequestErrorHandler, setUnauthorizedHandler } from './query-client'

afterEach(() => {
  queryClient.clear()
  setRequestErrorHandler(null)
  setUnauthorizedHandler(() => {})
})

describe('global request failures', () => {
  it('reports a query once after retries are exhausted', async () => {
    const report = vi.fn()
    setRequestErrorHandler(report)
    const error = new ApiError(503, undefined, 'Unavailable')
    const queryFn = vi.fn().mockRejectedValue(error)
    await expect(queryClient.fetchQuery({
      queryKey: ['retry-test'], queryFn, retry: 2, retryDelay: 0,
    })).rejects.toBe(error)
    expect(queryFn).toHaveBeenCalledTimes(3)
    expect(report).toHaveBeenCalledExactlyOnceWith(error, 'query')
  })

  it('reports schema drift from successful HTTP responses', async () => {
    const report = vi.fn()
    setRequestErrorHandler(report)
    await expect(queryClient.fetchQuery({
      queryKey: ['schema-test'], retry: false,
      queryFn: async () => z.object({ id: z.string() }).parse({ id: 123 }),
    })).rejects.toBeInstanceOf(z.ZodError)
    expect(report).toHaveBeenCalledExactlyOnceWith(expect.any(z.ZodError), 'query')
  })

  it('reports mutation failures without forwarding mutation variables', async () => {
    const report = vi.fn()
    setRequestErrorHandler(report)
    const error = new ApiError(500, undefined, 'Failed')
    const mutation = queryClient.getMutationCache().build(queryClient, {
      mutationFn: async (_variables: { privateValue: string }) => { throw error },
    })
    await expect(mutation.execute({ privateValue: 'child details' })).rejects.toBe(error)
    expect(report).toHaveBeenCalledExactlyOnceWith(error, 'mutation')
  })

  it.each([400, 403, 404, 409, 422, 429])('leaves expected HTTP %s errors to the UI', async (status) => {
    const report = vi.fn()
    setRequestErrorHandler(report)
    await expect(queryClient.fetchQuery({
      queryKey: ['expected-error'], retry: false,
      queryFn: async () => { throw new ApiError(status, undefined, 'Expected') },
    })).rejects.toBeInstanceOf(ApiError)
    expect(report).not.toHaveBeenCalled()
  })

  it.each([false, true])('preserves 401 navigation with expectsAnonymous=%s', async (expectsAnonymous) => {
    const report = vi.fn()
    const navigate = vi.fn()
    setRequestErrorHandler(report)
    setUnauthorizedHandler(navigate)
    await expect(queryClient.fetchQuery({
      queryKey: ['session'], meta: { expectsAnonymous },
      queryFn: async () => { throw new ApiError(401, undefined, 'Unauthorized') },
    })).rejects.toBeInstanceOf(ApiError)
    expect(navigate).toHaveBeenCalledTimes(expectsAnonymous ? 0 : 1)
    expect(report).not.toHaveBeenCalled()
  })

  it('does not report cancellation', async () => {
    const report = vi.fn()
    setRequestErrorHandler(report)
    await expect(queryClient.fetchQuery({
      queryKey: ['aborted'], retry: false,
      queryFn: async () => { throw new DOMException('Aborted', 'AbortError') },
    })).rejects.toThrow('Aborted')
    expect(report).not.toHaveBeenCalled()
  })
})
