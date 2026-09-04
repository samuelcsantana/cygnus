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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  HEIGHT_CM_MAX,
  HEIGHT_CM_MIN,
  WEIGHT_KG_MAX,
  WEIGHT_KG_MIN,
  centimetersInputToMillimeters,
  gramsToKilogramsInput,
  kilogramsInputToGrams,
  millimetersToCentimetersInput,
  parseDecimalInput,
} from '@/shared/utils/measurements'

import { useDeleteAppointment, useUpdateAppointment } from '../api/appointments.hooks'
import type { Appointment } from '../api/appointments.schemas'
import { AppointmentStatusBadge } from './AppointmentStatusBadge'

interface AppointmentDetailDialogProps {
  appointment: Appointment | null
  onOpenChange: (open: boolean) => void
}

/**
 * Vazio é resposta válida — a maioria das visitas não mede nada. Só um valor presente e fora da
 * faixa é erro.
 */
function outOfRange(value: string, min: number, max: number): boolean {
  const parsed = parseDecimalInput(value)
  return parsed !== null && (!Number.isFinite(parsed) || parsed < min || parsed > max)
}

export function AppointmentDetailDialog({ appointment, onOpenChange }: AppointmentDetailDialogProps) {
  const { t } = useTranslation()
  const updateAppointment = useUpdateAppointment(appointment?.babyId ?? '')
  const deleteAppointment = useDeleteAppointment(appointment?.babyId ?? '')
  const [notes, setNotes] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [heightCm, setHeightCm] = useState('')

  // Uma visita ainda por acontecer não tem o que medir, e a API recusa o valor — mostrar os campos
  // aqui seria oferecer o que o servidor devolve como 400. O caminho é marcar como realizada
  // primeiro, que é um clique já existente logo abaixo.
  const visitHasHappened = appointment !== null && appointment.status !== 'SCHEDULED'
  const measurementError =
    outOfRange(weightKg, WEIGHT_KG_MIN, WEIGHT_KG_MAX) || outOfRange(heightCm, HEIGHT_CM_MIN, HEIGHT_CM_MAX)

  useEffect(() => {
    if (appointment) {
      setNotes(appointment.notes ?? '')
      setWeightKg(gramsToKilogramsInput(appointment.weightGrams))
      setHeightCm(millimetersToCentimetersInput(appointment.heightMillimeters))
    }
  }, [appointment])

  async function handleSaveNotes() {
    if (!appointment || measurementError) return
    // A mensagem de erro já é renderizada acima a partir de updateAppointment
    // .isError; o que faltava era o catch. Sem ele a rejeição sobe como
    // unhandled rejection e vira evento de crash no Sentry para uma falha que
    // a tela já está tratando.
    try {
      await updateAppointment.mutateAsync({
        appointmentId: appointment.id,
        input: {
          notes: notes || null,
          // Só para visita que aconteceu, e `null` quando o campo foi esvaziado: apagar uma medida
          // é uma correção legítima, e omitir o campo significaria "não mexi", que é outra coisa.
          ...(visitHasHappened
            ? {
                weightGrams: kilogramsInputToGrams(weightKg),
                heightMillimeters: centimetersInputToMillimeters(heightCm),
              }
            : {}),
        },
      })
    } catch {
      return
    }
    toast.success(t('appointments.detail.notesSavedToast'))
  }

  async function handleDelete() {
    if (!appointment) return
    try {
      await deleteAppointment.mutateAsync(appointment.id)
    } catch {
      toast.error(t('appointments.detail.deleteError'))
      return
    }
    toast.success(t('appointments.detail.deleteSuccessToast'))
    onOpenChange(false)
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

            {visitHasHappened && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="detail-weight">{t('appointments.form.weightLabel')}</Label>
                  <Input
                    id="detail-weight"
                    inputMode="decimal"
                    placeholder={t('appointments.form.weightPlaceholder')}
                    aria-invalid={outOfRange(weightKg, WEIGHT_KG_MIN, WEIGHT_KG_MAX)}
                    className="mt-2 font-mono"
                    value={weightKg}
                    onChange={(event) => setWeightKg(event.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="detail-height">{t('appointments.form.heightLabel')}</Label>
                  <Input
                    id="detail-height"
                    inputMode="decimal"
                    placeholder={t('appointments.form.heightPlaceholder')}
                    aria-invalid={outOfRange(heightCm, HEIGHT_CM_MIN, HEIGHT_CM_MAX)}
                    className="mt-2 font-mono"
                    value={heightCm}
                    onChange={(event) => setHeightCm(event.target.value)}
                  />
                </div>
              </div>
            )}

            {measurementError && (
              <p role="alert" className="text-destructive text-sm">
                {outOfRange(weightKg, WEIGHT_KG_MIN, WEIGHT_KG_MAX)
                  ? t('appointments.form.weightInvalid')
                  : t('appointments.form.heightInvalid')}
              </p>
            )}

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
                disabled={updateAppointment.isPending || measurementError}
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
                  <Button type="button" onClick={() => handleSetStatus('COMPLETED')} disabled={updateAppointment.isPending}>
                    {t('appointments.detail.markCompleted')}
                  </Button>
                </div>
              )}
            </div>

            {/* Excluir fica fora do bloco de `SCHEDULED` de propósito: cancelar
                só faz sentido para o que está marcado, mas errar de digitação
                acontece em qualquer estado — e desde que dá para registrar
                consulta passada, "cancelar" um fato já ocorrido não quer dizer
                nada. É a única saída para um registro que não deveria existir. */}
            <div className="flex justify-start border-t border-border pt-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="ghost" className="text-destructive" disabled={deleteAppointment.isPending}>
                    {t('appointments.detail.deleteAppointment')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('appointments.detail.deleteConfirmTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('appointments.detail.deleteConfirmDescription', { doctorName: appointment.doctorName })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('appointments.detail.deleteConfirmDismiss')}</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={deleteAppointment.isPending}
                    >
                      {t('appointments.detail.deleteConfirmAction')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
