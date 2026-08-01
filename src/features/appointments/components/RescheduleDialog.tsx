import { useTranslation } from 'react-i18next'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { splitScheduledAt } from '@/lib/date'

import { useUpdateAppointment } from '../api/appointments.hooks'
import type { Appointment } from '../api/appointments.schemas'
import { AppointmentForm } from './AppointmentForm'

interface RescheduleDialogProps {
  babyId: string
  appointment: Appointment | null
  onOpenChange: (open: boolean) => void
}

export function RescheduleDialog({ babyId, appointment, onOpenChange }: RescheduleDialogProps) {
  const { t } = useTranslation()
  const updateAppointment = useUpdateAppointment(babyId)

  return (
    <Dialog open={!!appointment} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('appointments.reschedule.title')}</DialogTitle>
        </DialogHeader>

        {appointment && (
          <AppointmentForm
            defaultValues={{
              ...splitScheduledAt(appointment.scheduledAt),
              doctorName: appointment.doctorName,
              location: appointment.location ?? '',
              reason: appointment.reason ?? '',
            }}
            submitLabel={t('appointments.reschedule.submit')}
            showCancel
            onCancel={() => onOpenChange(false)}
            onSubmit={async (values) => {
              const scheduledAt = new Date(`${values.date}T${values.time}`).toISOString()
              await updateAppointment.mutateAsync({
                appointmentId: appointment.id,
                input: {
                  scheduledAt,
                  doctorName: values.doctorName,
                  location: values.location || null,
                  reason: values.reason || null,
                },
              })
              onOpenChange(false)
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
