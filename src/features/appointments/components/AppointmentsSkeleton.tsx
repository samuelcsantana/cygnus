import { Skeleton } from '@/components/ui/skeleton'

export function AppointmentsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2" aria-hidden="true">
      {[0, 1, 2, 3].map((index) => (
        <div key={index} className="rounded-2xl border-[1.5px] border-transparent bg-card p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] sm:p-6">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <Skeleton className="h-11 w-11 flex-shrink-0 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <div className="space-y-2 text-right">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="mt-4 h-9 w-full rounded-xl" />
        </div>
      ))}
    </div>
  )
}
