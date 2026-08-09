import { useState } from 'react'

import type { Baby } from '@/features/babies/api/babies.schemas'
import { BabyFilterChips } from '@/shared/components/BabyFilterChips'

import type { Appointment } from '../api/appointments.schemas'
import { AppointmentCard } from './AppointmentCard'
import { AppointmentDetailDialog } from './AppointmentDetailDialog'
import { RescheduleDialog } from './RescheduleDialog'

interface AppointmentsListProps {
  items: Appointment[]
  babies: Baby[]
}

// Renders a single, merged, household-wide grid — each card tagged with which
// baby it belongs to, so a family with several children sees one chronological
// list instead of one full section repeated per child.
export function AppointmentsList({ items, babies }: AppointmentsListProps) {
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null)
  const [detailTarget, setDetailTarget] = useState<Appointment | null>(null)
  const [babyFilter, setBabyFilter] = useState<string | null>(null)
  const babyById = new Map(babies.map((baby) => [baby.id, baby]))

  const filteredItems = babyFilter ? items.filter((item) => item.babyId === babyFilter) : items

  return (
    <div>
      <BabyFilterChips babies={babies} value={babyFilter} onChange={setBabyFilter} className="mb-6" />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {filteredItems.map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
            baby={babyById.get(appointment.babyId)}
            onReschedule={() => setRescheduleTarget(appointment)}
            onViewDetails={() => setDetailTarget(appointment)}
          />
        ))}
      </div>

      <RescheduleDialog appointment={rescheduleTarget} onOpenChange={(open) => !open && setRescheduleTarget(null)} />
      <AppointmentDetailDialog appointment={detailTarget} onOpenChange={(open) => !open && setDetailTarget(null)} />
    </div>
  )
}
