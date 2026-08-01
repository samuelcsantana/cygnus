import { Skeleton } from '@/components/ui/skeleton'

export function VaccineCalendarSkeleton() {
  return (
    <div className="space-y-8" aria-hidden="true">
      {[0, 1].map((groupIndex) => (
        <section key={groupIndex}>
          <Skeleton className="mb-3 h-4 w-32" />
          <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm">
            <ul className="divide-y divide-slate-100">
              {[0, 1, 2].map((rowIndex) => (
                <li key={rowIndex} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:gap-4 sm:p-6">
                  <div className="space-y-2 sm:flex-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-3 w-full sm:flex-1" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ))}
    </div>
  )
}
