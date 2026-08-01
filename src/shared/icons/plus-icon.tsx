import { IconBase, type IconProps } from './icon-base'

export function PlusIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </IconBase>
  )
}
