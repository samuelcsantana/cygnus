import type { RouteObject } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { router } from './router'

type Route = Pick<RouteObject, 'path' | 'index' | 'lazy' | 'children'>

// Absolute paths, so the test names read as addresses; a route with no path of its own is a layout.
function flatten(routes: readonly Route[], parent = ''): { path: string; route: Route }[] {
  return routes.flatMap((route) => {
    const own = route.path?.startsWith('/') ? route.path : route.path ? `${parent}/${route.path}`.replace('//', '/') : parent
    const path = route.index ? parent || '/' : own
    const label = route.index || route.path ? path || '/' : `${path || '/'} (layout)`
    return [{ path: label, route }, ...flatten(route.children ?? [], own)]
  })
}

const routes = flatten(router.routes as readonly Route[])

/**
 * Every page is lazy-loaded, which is what keeps the entry chunk small, and also what hides a broken
 * page until someone navigates to it: a renamed export fails at runtime, inside a dynamic import no
 * other test reaches. Each route's loader runs here and must hand back a component.
 */
describe('router', () => {
  it.each(routes.filter(({ route }) => typeof route.lazy === 'function'))('$path resolves to a component', async ({ route }) => {
    const resolved = await (route.lazy as () => Promise<RouteObject>)()

    expect(typeof resolved.Component).toBe('function')
  })

  // These addresses are printed outside the app - in e-mails, the README, invite links shared over
  // chat - so a route moving silently breaks every copy already sent.
  it('keeps the public addresses that are linked from outside the app', () => {
    const paths = new Set(routes.map(({ path }) => path))

    for (const path of ['/', '/login', '/register', '/privacidade', '/termos', '/invites/:code', '/auth/google/complete', '/*']) {
      expect(paths, path).toContain(path)
    }
  })
})
