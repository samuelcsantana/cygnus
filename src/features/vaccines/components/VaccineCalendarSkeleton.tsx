import { Skeleton } from '@/components/ui/skeleton'

export function VaccineCalendarSkeleton() {
  return (
    <div aria-hidden="true">
      <Skeleton className="mb-5 h-[76px] w-full rounded-2xl" />
      <div className="mb-5 flex gap-2">
        {[0, 1, 2, 3].map((pillIndex) => (
          <Skeleton key={pillIndex} className="h-8 w-24 rounded-full" />
        ))}
      </div>
      <ul className="flex flex-col gap-2">
        {[0, 1, 2, 3, 4].map((rowIndex) => (
          <li key={rowIndex} className="flex items-center gap-3.5 rounded-2xl bg-white p-4 shadow-[0_1px_6px_rgba(0,0,0,0.03)]">
            <Skeleton className="h-9 w-9 flex-shrink-0 rounded-[10px]" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </li>
        ))}
      </ul>
    </div>
  )
}
