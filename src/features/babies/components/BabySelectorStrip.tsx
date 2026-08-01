import { useState } from 'react'

import { useSelectedBabyStore } from '@/shared/stores/selectedBaby.store'

import type { Baby } from '../api/babies.schemas'
import { BabyCard } from './BabyCard'
import { EditBabyDialog } from './EditBabyDialog'

interface BabySelectorStripProps {
  babies: Baby[]
}

export function BabySelectorStrip({ babies }: BabySelectorStripProps) {
  const selectedBabyId = useSelectedBabyStore((state) => state.selectedBabyId)
  const setSelectedBabyId = useSelectedBabyStore((state) => state.setSelectedBabyId)
  const [editTarget, setEditTarget] = useState<Baby | null>(null)

  return (
    <>
      <div className="flex flex-wrap gap-4">
        {babies.map((baby) => (
          <BabyCard
            key={baby.id}
            baby={baby}
            selected={baby.id === selectedBabyId}
            onSelect={() => setSelectedBabyId(baby.id)}
            onEdit={() => setEditTarget(baby)}
          />
        ))}
      </div>

      <EditBabyDialog baby={editTarget} onOpenChange={(open) => !open && setEditTarget(null)} />
    </>
  )
}
