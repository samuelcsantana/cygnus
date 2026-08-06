import { create } from 'zustand'

interface AddBabyDialogState {
  isOpen: boolean
  open: () => void
  close: () => void
}

// Shared across distant components (app shell, dashboard empty state, profile
// page) that all need to trigger the same modal. Not persisted: purely
// ephemeral UI state.
export const useAddBabyDialogStore = create<AddBabyDialogState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}))
