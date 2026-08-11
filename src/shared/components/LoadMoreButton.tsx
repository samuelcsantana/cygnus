import { cn } from '@/lib/utils'

interface LoadMoreButtonProps {
  onClick: () => void
  label: string
  className?: string
}

export function LoadMoreButton({ onClick, label, className }: LoadMoreButtonProps) {
  return (
    <div className={cn('mt-6 flex justify-center', className)}>
      <button
        type="button"
        onClick={onClick}
        className="rounded-full bg-white px-5 py-2 text-[13px] font-semibold text-ink-muted shadow-sm transition-colors hover:bg-slate-50"
      >
        {label}
      </button>
    </div>
  )
}
