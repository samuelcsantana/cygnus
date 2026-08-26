import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import { useUpdateAppointment } from '../api/appointments.hooks'
import type { Appointment } from '../api/appointments.schemas'
import { AppointmentStatusBadge } from './AppointmentStatusBadge'

interface AppointmentDetailDialogProps {
  appointment: Appointment | null
  onOpenChange: (open: boolean) => void
}

export function AppointmentDetailDialog({ appointment, onOpenChange }: AppointmentDetailDialogProps) {
  const { t } = useTranslation()
  const updateAppointment = useUpdateAppointment(appointment?.babyId ?? '')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (appointment) {
      setNotes(appointment.notes ?? '')
    }
  }, [appointment])

  async function handleSaveNotes() {
    if (!appointment) return
    // A mensagem de erro já é renderizada acima a partir de updateAppointment
    // .isError; o que faltava era o catch. Sem ele a rejeição sobe como
    // unhandled rejection e vira evento de crash no Sentry para uma falha que
    // a tela já está tratando.
    try {
      await updateAppointment.mutateAsync({ appointmentId: appointment.id, input: { notes: notes || null } })
    } catch {
      return
    }
    toast.success(t('appointments.detail.notesSavedToast'))
  }

  async function handleSetStatus(status: 'COMPLETED' | 'CANCELLED') {
    if (!appointment) return
    try {
      await updateAppointment.mutateAsync({ appointmentId: appointment.id, input: { status, notes: notes || null } })
    } catch {
      return
    }
    toast.success(
      status === 'CANCELLED'
        ? t('appointments.detail.cancelSuccessToast')
        : t('appointments.detail.completeSuccessToast'),
    )
    onOpenChange(false)
  }

  return (
    <Dialog open={!!appointment} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('appointments.detail.title')}</DialogTitle>
        </DialogHeader>

        {appointment && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-bold text-ink">{appointment.doctorName}</p>
              <AppointmentStatusBadge status={appointment.status} />
            </div>

            <div>
              <Label htmlFor="detail-notes">{t('appointments.detail.notesLabel')}</Label>
              <Textarea
                id="detail-notes"
                rows={4}
                className="mt-2"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>

            {updateAppointment.isError && (
              <p role="alert" className="text-destructive text-sm">
                {t('appointments.detail.genericError')}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveNotes}
                disabled={updateAppointment.isPending}
              >
                {t('appointments.detail.saveNotes')}
              </Button>

              {appointment.status === 'SCHEDULED' && (
                <div className="flex gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button type="button" variant="outline" disabled={updateAppointment.isPending}>
                        {t('appointments.detail.cancelAppointment')}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('appointments.detail.cancelConfirmTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('appointments.detail.cancelConfirmDescription', {
                            doctorName: appointment.doctorName,
                          })}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('appointments.detail.cancelConfirmDismiss')}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleSetStatus('CANCELLED')}
                          disabled={updateAppointment.isPending}
                        >
                          {t('appointments.detail.cancelConfirmAction')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button
                    type="button"
                    onClick={() => handleSetStatus('COMPLETED')}
                    disabled={updateAppointment.isPending}
                    className="bg-violet-600 text-white hover:bg-violet-700"
                  >
                    {t('appointments.detail.markCompleted')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
