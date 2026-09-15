import type { AnchorHTMLAttributes, ReactNode } from 'react'

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string
  children: ReactNode
}

/** Vite game bundle shim — maps `next/link` to a plain anchor. */
export default function Link({ href, children, className, ...rest }: LinkProps) {
  return (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  )
}
