/** A quiet surface keeps attention on the form and the brand photograph. */
export function AuthBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-40 -top-48 size-[32rem] rounded-full bg-auth-button/5 blur-3xl" />
      <div className="absolute -bottom-48 -right-40 size-[32rem] rounded-full bg-auth-button/5 blur-3xl" />
    </div>
  )
}
