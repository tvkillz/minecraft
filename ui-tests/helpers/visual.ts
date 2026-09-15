import type { Locator, Page } from '@playwright/test'

/**
 * Small pink masks only — volatile text that CSS-hide would leave awkward empty chrome for.
 * Card art / cash+credit prices are CSS-hidden in stabilize (not masked).
 */
export function portalDynamicMasks(page: Page): Locator[] {
  return [
    page.locator('.portal__account-name'),
    page.locator('.portal__account-credits'),
    page.locator('.portal__toolbar-balance'),
    page.locator('.portal__cart-badge'),
    page.locator('.portal-transactions__list'),
    page.locator('.portal-transactions__loading'),
    page.locator('.portal-transactions__empty'),
    page.locator('.portal-transactions__pagination-summary'),
    page.locator('.withdrawal-modal__balance'),
    page.locator('.withdrawal-modal__estimate'),
    page.locator('.portal-profile__input'),
    page.locator('.portal-profile__status'),
    page.locator('.billing-form input, .billing-form select, .billing-form textarea'),
    page.locator('.site-footer__contact'),
    page.locator('.site-footer__copyright'),
  ]
}

export const portalScreenshotOptions = {
  fullPage: false as const,
  timeout: 80_000,
  maxDiffPixelRatio: 0.02,
}
