import { createBrowserRouter, Navigate } from 'react-router-dom'

import type { AuthRouteHandle } from '@/features/auth/components/AuthLayout'

import { AppShellLayout } from './routes/AppShellLayout'
import { NotFoundRoute } from './routes/NotFoundRoute'
import { ProtectedLayout } from './routes/ProtectedLayout'
import { RouteErrorRoute } from './routes/RouteErrorRoute'
import { RouteHydrateFallback } from './routes/RouteHydrateFallback'

// Route-level code splitting: each feature page (and its forms, dialogs,
// API hooks) only downloads when a user actually navigates there, instead
// of all shipping in the single ~721KB bundle Vite warns about on build.
export const router = createBrowserRouter([
  {
    hydrateFallbackElement: <RouteHydrateFallback />,
    // Na raiz, para cobrir toda rota filha. Sem isto o React Router mostra a
    // própria tela de desenvolvimento — "Unexpected Application Error!" mais o
    // stack — ao usuário final, e o ErrorBoundary do App.tsx nunca vê o caso:
    // erro de rota é tratado pelo roteador antes de subir para o React.
    errorElement: <RouteErrorRoute />,
    children: [
      {
        // One parent for every public screen, so the segmented control
        // switching between login and register swaps only the form. Rendered as
        // siblings — each route wrapping its own <AuthLayout> — React saw a
        // different subtree at that position and rebuilt the whole card, brand
        // panel and hero <img> included. Lazy on the layout too: the shell is
        // shared but must not ride along in the entry chunk for signed-in users.
        //
        // Which children get the tabs is decided by the `authTabs` handle, not
        // by being here.
        lazy: () => import('@/features/auth/components/AuthLayout').then((m) => ({ Component: m.AuthLayout })),
        children: [
          {
            path: '/login',
            // `authTabs` is what puts the segmented control and the card's
            // height floor on screen — see AuthRouteHandle in AuthLayout.tsx.
            handle: { authTabs: true } satisfies AuthRouteHandle,
            lazy: () => import('@/features/auth/routes/LoginRoute').then((m) => ({ Component: m.LoginRoute })),
          },
          {
            path: '/register',
            handle: { authTabs: true } satisfies AuthRouteHandle,
            lazy: () => import('@/features/auth/routes/RegisterRoute').then((m) => ({ Component: m.RegisterRoute })),
          },
          {
            // Shares the auth shell but not the segmented control: an invite is
            // neither of the two tabs. Still deliberately outside
            // ProtectedLayout — the preview has to render for a logged-out
            // visitor, which is the whole audience of an invite link (see
            // InviteRedeemRoute.tsx).
            path: '/invites/:code',
            lazy: () => import('@/app/routes/InviteRedeemRoute').then((m) => ({ Component: m.InviteRedeemRoute })),
          },
        ],
      },
      {
        // Public on purpose, and lazy like every other route: a privacy policy
        // that demands a login to be read does not do the thing it exists to
        // do. Both paths render the same component — the structure is shared
        // and only the copy differs.
        path: '/privacidade',
        lazy: () =>
          import('@/features/legal/routes/LegalDocumentRoute').then((m) => ({
            Component: () => <m.LegalDocumentRoute documentId="privacy" />,
          })),
      },
      {
        path: '/termos',
        lazy: () =>
          import('@/features/legal/routes/LegalDocumentRoute').then((m) => ({
            Component: () => <m.LegalDocumentRoute documentId="terms" />,
          })),
      },
      {
        path: '/',
        element: <ProtectedLayout />,
        children: [
          {
            element: <AppShellLayout />,
            children: [
              { index: true, element: <Navigate to="/dashboard" replace /> },
              {
                path: 'dashboard',
                lazy: () =>
                  import('@/features/babies/routes/DashboardRoute').then((m) => ({ Component: m.DashboardRoute })),
              },
              {
                path: 'vaccines',
                lazy: () =>
                  import('@/features/vaccines/routes/VaccinesRoute').then((m) => ({ Component: m.VaccinesRoute })),
              },
              {
                path: 'vaccines/:babyId/card',
                lazy: () =>
                  import('@/features/vaccines/routes/VaccinationCardRoute').then((m) => ({
                    Component: m.VaccinationCardRoute,
                  })),
              },
              {
                path: 'appointments',
                lazy: () =>
                  import('@/features/appointments/routes/AppointmentsRoute').then((m) => ({
                    Component: m.AppointmentsRoute,
                  })),
              },
              {
                path: 'milestones',
                lazy: () =>
                  import('@/features/milestones/routes/MilestonesRoute').then((m) => ({
                    Component: m.MilestonesRoute,
                  })),
              },
              {
                path: 'notifications',
                lazy: () =>
                  import('@/features/notifications/routes/NotificationsRoute').then((m) => ({
                    Component: m.NotificationsRoute,
                  })),
              },
              {
                path: 'profile',
                lazy: () =>
                  import('@/features/profile/routes/ProfileRoute').then((m) => ({ Component: m.ProfileRoute })),
              },
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundRoute /> },
    ],
  },
])
