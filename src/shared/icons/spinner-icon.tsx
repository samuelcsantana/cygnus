import { IconBase, type IconProps } from './icon-base'

// Two-part ring: a full track at low opacity plus a quarter arc, so the
// rotation reads as motion. `animate-spin` belongs on the usage site — the
// icon itself stays static, like every other icon here.
export function SpinnerIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" />
    </IconBase>
  )
}
