import { useEffect } from 'react'

import { useBabies } from '@/features/babies/api/babies.hooks'
import { useSelectedBabyStore } from '@/shared/stores/selectedBaby.store'

/**
 * Resolves which baby a baby-scoped route (vaccines, appointments, milestones)
 * should show: the explicitly selected one, or the only one when there's
 * exactly one. Returns null when the caller should redirect to the dashboard
 * to let the user pick.
 */
export function useEffectiveBabyId(): string | null {
  const babies = useBabies()
  const selectedBabyId = useSelectedBabyStore((state) => state.selectedBabyId)
  const setSelectedBabyId = useSelectedBabyStore((state) => state.setSelectedBabyId)

  const babyList = babies.data ?? []
  const onlyBaby = babyList.length === 1 ? babyList[0] : undefined

  useEffect(() => {
    if (!selectedBabyId && onlyBaby) {
      setSelectedBabyId(onlyBaby.id)
    }
  }, [selectedBabyId, onlyBaby, setSelectedBabyId])

  return selectedBabyId ?? onlyBaby?.id ?? null
}
