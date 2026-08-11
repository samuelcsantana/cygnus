import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AppShellLayout } from './routes/AppShellLayout'
import { NotFoundRoute } from './routes/NotFoundRoute'
import { ProtectedLayout } from './routes/ProtectedLayout'

// Route-level code splitting: each feature page (and its forms, dialogs,
// API hooks) only downloads when a user actually navigates there, instead
// of all shipping in the single ~721KB bundle Vite warns about on build.
export const router = createBrowserRouter([
  {
    path: '/login',
    lazy: () => import('@/features/auth/routes/LoginRoute').then((m) => ({ Component: m.LoginRoute })),
  },
  {
    path: '/register',
    lazy: () => import('@/features/auth/routes/RegisterRoute').then((m) => ({ Component: m.RegisterRoute })),
  },
  {
    // Deliberately not nested under ProtectedLayout: the invite preview must
    // render for logged-out visitors too (see InviteRedeemRoute.tsx).
    path: '/invites/:code',
    lazy: () => import('@/app/routes/InviteRedeemRoute').then((m) => ({ Component: m.InviteRedeemRoute })),
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
            lazy: () => import('@/features/babies/routes/DashboardRoute').then((m) => ({ Component: m.DashboardRoute })),
          },
          {
            path: 'vaccines',
            lazy: () => import('@/features/vaccines/routes/VaccinesRoute').then((m) => ({ Component: m.VaccinesRoute })),
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
              import('@/features/milestones/routes/MilestonesRoute').then((m) => ({ Component: m.MilestonesRoute })),
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
            lazy: () => import('@/features/profile/routes/ProfileRoute').then((m) => ({ Component: m.ProfileRoute })),
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundRoute /> },
])
