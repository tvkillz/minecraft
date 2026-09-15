'use client'

import type { CSSProperties } from 'react'
import Link from 'next/link'
import { appConfig } from '@/config'
import { useCookieConsent } from '@/components/cookies/CookieConsentProvider'
import './Footer.css'

function SocialIcon({
  label,
  href,
  icon,
}: {
  label: string
  href: string
  icon: string
}) {
  return (
    <a
      href={href}
      className="site-footer__social-link"
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
    >
      <span
        className="site-footer__social-icon"
        style={{ '--social-icon-url': `url("${icon}")` } as CSSProperties}
        aria-hidden="true"
      />
    </a>
  )
}

export default function Footer() {
  const { logo, descriptions } = appConfig
  const { footer } = descriptions
  const { openSettings } = useCookieConsent()

  const headerLogo = logo.headerLogo ?? logo.src
  const headerLogoAlt = logo.headerLogoAlt ?? logo.alt

  return (
    <footer className="site-footer" aria-label="Site footer">
      <div className="site-footer__inner">
        <div className="site-footer__grid">
          <div className="site-footer__brand">
            <div className="site-footer__brand-row">
              <Link href={appConfig.domain.routes.home} className="site-footer__brand-link">
                <img
                  src={headerLogo}
                  alt={headerLogoAlt}
                  className={
                    logo.headerLogo ? 'site-footer__wordmark' : 'site-footer__logo'
                  }
                />
              </Link>

            </div>

            <p className="site-footer__brand-tagline">{footer.brand.tagline}</p>
          </div>

          <div className="site-footer__column">
            <h3 className="site-footer__heading">Legal</h3>
            <ul className="site-footer__links" role="list">
              {footer.legal.map((link) => (
                <li key={link.id}>
                  <Link href={link.href} className="site-footer__link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="site-footer__column">
            <h3 className="site-footer__heading">Contact</h3>
            <ul className="site-footer__contact" role="list">
              <li>
                <span className="site-footer__contact-label">Company name:</span>{' '}
                {footer.contact.companyName}
              </li>
              <li>
                <span className="site-footer__contact-label">Company number:</span>{' '}
                {footer.contact.companyNumber}
              </li>
              <li>
                <span className="site-footer__contact-label">Registered address:</span>{' '}
                {footer.contact.address}
              </li>
              <li>
                <a href={`mailto:${footer.contact.email}`} className="site-footer__link">
                  {footer.contact.email}
                </a>
              </li>
            </ul>

            {footer.social.some((item) => item.href.trim()) ? (
              <ul className="site-footer__social site-footer__contact-social" aria-label="Social media">
                {footer.social
                  .filter((item) => item.href.trim())
                  .map((item) => (
                    <li key={item.id}>
                      <SocialIcon label={item.label} href={item.href} icon={item.icon} />
                    </li>
                  ))}
              </ul>
            ) : null}

            {footer.payments.length > 0 ? (
              <div className="site-footer__payments" aria-label="Accepted payment methods">
                {footer.payments.map((item) => (
                  <img
                    key={item.id}
                    src={item.icon}
                    alt={item.label}
                    className="site-footer__payment-icon"
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="site-footer__sub">
          <p className="site-footer__copyright">{footer.copyright}</p>
          <button type="button" className="site-footer__cookie-btn" onClick={openSettings}>
            {footer.cookieSettingsLabel}
          </button>
        </div>

        {/* <p className="site-footer__sub-copy">{footer.subCopyright}</p> */}
      </div>
    </footer>
  )
}
