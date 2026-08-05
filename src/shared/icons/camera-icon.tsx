import { IconBase, type IconProps } from './icon-base'

export function CameraIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 8a2 2 0 012-2h1.5l1-1.5h7l1 1.5H18a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V8z" />
      <circle cx="12" cy="13" r="3.5" />
    </IconBase>
  )
}
