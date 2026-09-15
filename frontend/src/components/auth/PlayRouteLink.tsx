'use client'

import type { ComponentProps, ReactNode } from 'react'
import { appConfig } from '@/config'
import ProtectedNavLink from '@/components/auth/ProtectedNavLink'

type PlayRouteLinkProps = Omit<ComponentProps<typeof ProtectedNavLink>, 'href' | 'children'> & {
  children: ReactNode
}

/** Navigates to /play when signed in; sign-in modal + redirect otherwise. */
export default function PlayRouteLink({ children, ...rest }: PlayRouteLinkProps) {
  return (
    <ProtectedNavLink href={appConfig.domain.routes.play} {...rest}>
      {children}
    </ProtectedNavLink>
  )
}
