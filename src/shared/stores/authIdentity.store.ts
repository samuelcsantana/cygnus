import { create } from 'zustand'

/**
 * POST /auth/login returns no user payload beyond {status, message}, so
 * useLogin seeds this store with just the submitted email as a provisional
 * value. GET /auth/me (see useSyncAuthIdentity) confirms/corrects it with
 * the real name right after — including after a page refresh, where this
 * store starts out empty again. Consumers should still degrade gracefully
 * (name can be briefly null) rather than assume it's always populated.
 */
interface AuthIdentity {
  id: string | null
  email: string
  name: string | null
}

interface AuthIdentityState {
  identity: AuthIdentity | null
  setIdentity: (identity: AuthIdentity) => void
  clearIdentity: () => void
}

export const useAuthIdentityStore = create<AuthIdentityState>((set) => ({
  identity: null,
  setIdentity: (identity) => set({ identity }),
  clearIdentity: () => set({ identity: null }),
}))
