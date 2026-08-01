import { create } from 'zustand'

/**
 * The backend only returns {id, email, name} from POST /auth/register.
 * POST /auth/login returns no body beyond {status, message}, and there is
 * no GET /auth/me yet — so after a plain login (or a page refresh) only the
 * submitted email is known. Consumers must degrade gracefully instead of
 * fabricating a name. See CLAUDE.md-derived plan, Section 1.
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
