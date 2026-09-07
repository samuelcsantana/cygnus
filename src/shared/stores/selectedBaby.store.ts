import { create } from 'zustand'

const STORAGE_KEY = 'cygnus.selectedBaby'

/**
 * Which child the app is showing — `null` meaning all of them.
 *
 * **The third Zustand store, and the rule says a third needs its reason written
 * down.** Here it is: until now the child filter was local state inside each
 * list, deliberately, because the app aggregates the family everywhere and each
 * page's chips answered only for that page. A menu that lists the children and
 * narrows the whole app to one is the opposite arrangement — the choice outlives
 * the page, so it cannot live in the page. Six routes read it and one menu
 * writes it.
 *
 * It is UI state, not server state, which keeps it on the right side of the
 * other rule: nothing here is fetched, and nothing here is the truth about
 * anything. The list of children still comes from `useBabies`.
 *
 * **`null` is a real answer, not "nothing selected".** The family view is what
 * this app does better than the design it borrows the menu from, and "Todas as
 * crianças" is the first row for that reason.
 */
interface SelectedBabyState {
  selectedBabyId: string | null
  select: (babyId: string | null) => void
  /**
   * Drops a selection that no longer exists.
   *
   * A child can be removed in this tab or another one, and the id survives in
   * localStorage; without this, every list silently filters to a child that is
   * not there and the app looks empty for reasons nobody can see. Called by the
   * menu, which is the one place that has the real list.
   */
  reconcile: (availableIds: readonly string[]) => void
}

/**
 * Restored from localStorage so the choice survives a reload: a parent who
 * narrowed the app to one child and refreshed did not change their mind. Wrapped
 * because storage throws in a private window with site data blocked, and an app
 * that will not boot there is a worse failure than a forgotten selection.
 */
function restore(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function persist(babyId: string | null): void {
  try {
    if (babyId === null) window.localStorage.removeItem(STORAGE_KEY)
    else window.localStorage.setItem(STORAGE_KEY, babyId)
  } catch {
    // Same reason as above: losing the preference is not worth an exception.
  }
}

export const useSelectedBabyStore = create<SelectedBabyState>((set, get) => ({
  selectedBabyId: restore(),
  select: (babyId) => {
    persist(babyId)
    set({ selectedBabyId: babyId })
  },
  reconcile: (availableIds) => {
    const current = get().selectedBabyId
    if (current !== null && !availableIds.includes(current)) {
      persist(null)
      set({ selectedBabyId: null })
    }
  },
}))
