import { createBrowserRouter, Navigate } from 'react-router-dom'

import { LoginRoute } from '@/features/auth/routes/LoginRoute'
import { RegisterRoute } from '@/features/auth/routes/RegisterRoute'
import { AppointmentsRoute } from '@/features/appointments/routes/AppointmentsRoute'
import { NewAppointmentRoute } from '@/features/appointments/routes/NewAppointmentRoute'
import { AddBabyRoute } from '@/features/babies/routes/AddBabyRoute'
import { DashboardRoute } from '@/features/babies/routes/DashboardRoute'
import { MilestonesRoute } from '@/features/milestones/routes/MilestonesRoute'
import { NewMilestoneRoute } from '@/features/milestones/routes/NewMilestoneRoute'
import { VaccinesRoute } from '@/features/vaccines/routes/VaccinesRoute'

import { AppShellLayout } from './routes/AppShellLayout'
import { NotFoundRoute } from './routes/NotFoundRoute'
import { ProtectedLayout } from './routes/ProtectedLayout'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginRoute />,
  },
  {
    path: '/register',
    element: <RegisterRoute />,
  },
  {
    path: '/',
    element: <ProtectedLayout />,
    children: [
      {
        element: <AppShellLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: 'dashboard', element: <DashboardRoute /> },
          { path: 'add-baby', element: <AddBabyRoute /> },
          { path: 'vaccines', element: <VaccinesRoute /> },
          { path: 'appointments', element: <AppointmentsRoute /> },
          { path: 'appointments/new', element: <NewAppointmentRoute /> },
          { path: 'milestones', element: <MilestonesRoute /> },
          { path: 'milestones/new', element: <NewMilestoneRoute /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundRoute /> },
])
