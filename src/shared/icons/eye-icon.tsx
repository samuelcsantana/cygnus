import { IconBase, type IconProps } from './icon-base'

export function EyeIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0" />
      <circle cx="12" cy="12" r="3" />
    </IconBase>
  )
}
