'use client'

import { Button, type ButtonVariant } from '@/components/ui/Button/Button'
import { useAuth } from '@/components/providers/AuthProvider'

type ProtectedNavButtonProps = {
  label: string
  href: string
  variant?: ButtonVariant
  className?: string
}

export default function ProtectedNavButton({
  label,
  href,
  variant = 'secondary',
  className,
}: ProtectedNavButtonProps) {
  const { requestAuthNavigation, loading } = useAuth()

  return (
    <Button
      type="button"
      variant={variant}
      size="md"
      className={className}
      disabled={loading}
      onClick={() => {
        requestAuthNavigation(href)
      }}
    >
      {label}
    </Button>
  )
}
