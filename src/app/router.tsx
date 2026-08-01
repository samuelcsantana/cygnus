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
            path: 'add-baby',
            lazy: () => import('@/features/babies/routes/AddBabyRoute').then((m) => ({ Component: m.AddBabyRoute })),
          },
          {
            path: 'vaccines',
            lazy: () => import('@/features/vaccines/routes/VaccinesRoute').then((m) => ({ Component: m.VaccinesRoute })),
          },
          {
            path: 'appointments',
            lazy: () =>
              import('@/features/appointments/routes/AppointmentsRoute').then((m) => ({
                Component: m.AppointmentsRoute,
              })),
          },
          {
            path: 'appointments/new',
            lazy: () =>
              import('@/features/appointments/routes/NewAppointmentRoute').then((m) => ({
                Component: m.NewAppointmentRoute,
              })),
          },
          {
            path: 'milestones',
            lazy: () =>
              import('@/features/milestones/routes/MilestonesRoute').then((m) => ({ Component: m.MilestonesRoute })),
          },
          {
            path: 'milestones/new',
            lazy: () =>
              import('@/features/milestones/routes/NewMilestoneRoute').then((m) => ({
                Component: m.NewMilestoneRoute,
              })),
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundRoute /> },
])
