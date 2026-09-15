'use client'

import Link from 'next/link'
import type { ComponentProps, MouseEvent, ReactNode } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'

type ProtectedNavLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & {
  href: string
  children: ReactNode
}

export default function ProtectedNavLink({
  href,
  children,
  onClick,
  ...rest
}: ProtectedNavLinkProps) {
  const { requestAuthNavigation, loading } = useAuth()

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e)
    if (e.defaultPrevented) return
    e.preventDefault()
    if (!loading) {
      requestAuthNavigation(href)
    }
  }

  return (
    <Link href={href} onClick={handleClick} {...rest}>
      {children}
    </Link>
  )
}
