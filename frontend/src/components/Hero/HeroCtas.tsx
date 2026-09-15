'use client'

import { appConfig, resolveCtaHref } from '@/config'
import ProtectedNavButton from '@/components/auth/ProtectedNavButton'
import { Button } from '@/components/ui/Button/Button'
import { routeRequiresAuth } from '@/lib/auth/guards'

const CTA_ACCENT_VARIANT = {
  purple: 'secondary',
  cyan: 'accent-cyan',
  ember: 'accent-ember',
} as const

export default function HeroCtas() {
  return (
    <div className="hero__cta">
      {appConfig.theme.heroCtas.map((cta) => {
        const href = resolveCtaHref(cta)
        const variant = CTA_ACCENT_VARIANT[cta.accent ?? 'purple']

        if (cta.route && routeRequiresAuth(cta.route)) {
          return (
            <ProtectedNavButton
              key={cta.id}
              label={cta.label}
              href={href}
              variant={variant}
              className="hero__cta-btn"
            />
          )
        }

        if (cta.route) {
          return (
            <Button
              key={cta.id}
              as="link"
              href={href}
              variant={variant}
              size="md"
              className="hero__cta-btn"
            >
              {cta.label}
            </Button>
          )
        }

        return (
          <Button
            key={cta.id}
            as="a"
            href={href}
            variant={variant}
            size="md"
            className="hero__cta-btn"
          >
            {cta.label}
          </Button>
        )
      })}
    </div>
  )
}
