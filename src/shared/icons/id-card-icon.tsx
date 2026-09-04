import { IconBase, type IconProps } from './icon-base'

export function IdCardIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <circle cx="8.5" cy="11" r="2" />
      <path d="M5 16c.6-1.5 2-2.3 3.5-2.3S11.4 14.5 12 16" />
      <path d="M15 10h4" />
      <path d="M15 14h4" />
    </IconBase>
  )
}
