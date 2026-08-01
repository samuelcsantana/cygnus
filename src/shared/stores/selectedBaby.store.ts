import { create } from 'zustand'

interface SelectedBabyState {
  selectedBabyId: string | null
  setSelectedBabyId: (id: string | null) => void
}

export const useSelectedBabyStore = create<SelectedBabyState>((set) => ({
  selectedBabyId: null,
  setSelectedBabyId: (id) => set({ selectedBabyId: id }),
}))
