interface ComingSoonPlaceholderProps {
  title: string
  message: string
}

export function ComingSoonPlaceholder({ title, message }: ComingSoonPlaceholderProps) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 text-center">
      <p className="text-lg font-semibold text-slate-700">{title}</p>
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  )
}
