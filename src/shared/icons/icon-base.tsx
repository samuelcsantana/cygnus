import type { ReactNode, SVGProps } from 'react'

export interface IconProps extends SVGProps<SVGSVGElement> {
  title?: string
}

interface IconBaseProps extends IconProps {
  children: ReactNode
}

export function IconBase({ title, children, ...props }: IconBaseProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  )
}
