import { useEffect, useState } from 'react'

const DEFAULT_PAGE_SIZE = 20

/**
 * Simple "load more" pagination over an already-filtered in-memory list —
 * this app's realistic data volumes (a family's health records) don't
 * warrant full page-number pagination machinery. The visible count resets
 * back to one page whenever `resetKey` changes — callers combine whichever
 * inputs should reset scroll position (typically the search term and/or
 * baby filter) into a single string/number, e.g. `${search}|${babyFilter}`.
 */
export function usePagedList<T>(items: T[], resetKey: string | number, pageSize = DEFAULT_PAGE_SIZE) {
  const [visibleCount, setVisibleCount] = useState(pageSize)

  useEffect(() => {
    setVisibleCount(pageSize)
    // Deliberately keyed only on `resetKey` (and the stable `pageSize`), not
    // on `items` — resetting on every items reference change (e.g. a
    // background refetch) would collapse an already-expanded list back down.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, pageSize])

  return {
    visibleItems: items.slice(0, visibleCount),
    hasMore: items.length > visibleCount,
    loadMore: () => setVisibleCount((count) => count + pageSize),
  }
}
