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

  // The selection persists in localStorage across logins — including a
  // different account signing in on the same browser without ever clicking
  // "logout" — so once the baby list has loaded, a selection that isn't in
  // it (belongs to nobody, or to someone else) must be treated as absent
  // rather than sent to the API as-is.
  const selectionIsStale = !!babies.data && !!selectedBabyId && !babyList.some((baby) => baby.id === selectedBabyId)
  const effectiveSelectedId = selectionIsStale ? null : selectedBabyId

  useEffect(() => {
    if (selectionIsStale) {
      setSelectedBabyId(null)
    } else if (!effectiveSelectedId && onlyBaby) {
      setSelectedBabyId(onlyBaby.id)
    }
  }, [selectionIsStale, effectiveSelectedId, onlyBaby, setSelectedBabyId])

  return effectiveSelectedId ?? onlyBaby?.id ?? null
}
