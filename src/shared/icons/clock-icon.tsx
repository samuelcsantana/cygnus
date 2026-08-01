import { IconBase, type IconProps } from './icon-base'

export function ClockIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </IconBase>
  )
}
