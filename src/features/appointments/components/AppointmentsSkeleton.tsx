import { Skeleton } from '@/components/ui/skeleton'

export function AppointmentsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2" aria-hidden="true">
      {[0, 1, 2, 3].map((index) => (
        <div key={index} className="relative overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
            <Skeleton className="h-14 w-20 rounded-2xl" />
          </div>
          <Skeleton className="mb-4 h-8 w-32 rounded-lg" />
          <Skeleton className="h-9 w-full rounded-xl" />
        </div>
      ))}
    </div>
  )
}
