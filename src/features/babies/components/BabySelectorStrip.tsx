import { useSelectedBabyStore } from '@/shared/stores/selectedBaby.store'

import type { Baby } from '../api/babies.schemas'
import { BabyCard } from './BabyCard'

interface BabySelectorStripProps {
  babies: Baby[]
}

export function BabySelectorStrip({ babies }: BabySelectorStripProps) {
  const selectedBabyId = useSelectedBabyStore((state) => state.selectedBabyId)
  const setSelectedBabyId = useSelectedBabyStore((state) => state.setSelectedBabyId)

  return (
    <div className="flex flex-wrap gap-4">
      {babies.map((baby) => (
        <BabyCard
          key={baby.id}
          baby={baby}
          selected={baby.id === selectedBabyId}
          onSelect={() => setSelectedBabyId(baby.id)}
        />
      ))}
    </div>
  )
}
