import { IconBase, type IconProps } from './icon-base'

export function ArrowLeftIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </IconBase>
  )
}
