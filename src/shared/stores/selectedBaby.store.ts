import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SelectedBabyState {
  selectedBabyId: string | null
  setSelectedBabyId: (id: string | null) => void
}

export const useSelectedBabyStore = create<SelectedBabyState>()(
  persist(
    (set) => ({
      selectedBabyId: null,
      setSelectedBabyId: (id) => set({ selectedBabyId: id }),
    }),
    { name: 'meu-nenem-selected-baby' },
  ),
)
