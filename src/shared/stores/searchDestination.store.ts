import { create } from 'zustand'

export interface SearchDestination {
  path: string
  keys: string[]
  query: string
  babyId: string | null
}
// Ephemeral handoff from global search to a feature page; never persisted.
export const useSearchDestinationStore = create<{
  revision: number
  target: SearchDestination | null
  set: (target: SearchDestination | null) => void
}>((set) => ({
  revision: 0,
  target: null,
  set: (target) => set((state) => ({ target, revision: state.revision + 1 })),
}))
export function useSearchDestination(path: string) {
  const target = useSearchDestinationStore((state) => state.target)
  return target?.path === path ? target : null
}
