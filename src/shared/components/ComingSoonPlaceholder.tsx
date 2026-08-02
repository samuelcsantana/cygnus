interface ComingSoonPlaceholderProps {
  title: string
  message: string
}

export function ComingSoonPlaceholder({ title, message }: ComingSoonPlaceholderProps) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 text-center">
      <p className="text-lg font-semibold text-ink-muted">{title}</p>
      <p className="text-sm text-ink-muted">{message}</p>
    </div>
  )
}
