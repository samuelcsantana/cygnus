import { IconBase, type IconProps } from './icon-base'

/** A rising line with its points — the shape of the page it opens. */
export function GrowthIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <path d="m7 15 4-5 3 3 5-6" />
      <circle cx="7" cy="15" r="0.5" />
      <circle cx="11" cy="10" r="0.5" />
      <circle cx="14" cy="13" r="0.5" />
      <circle cx="19" cy="7" r="0.5" />
    </IconBase>
  )
}
