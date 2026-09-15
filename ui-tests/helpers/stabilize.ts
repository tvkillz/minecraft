import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

/**
 * Kill animations / hide media for stable screenshots.
 * Do NOT blanket-force opacity/transform — closed cart/modals use those to stay off-screen.
 */
export async function stabilizePage(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
      }

      /* Closed overlays must stay hidden (drawer uses translateX; modals use opacity) */
      .credits-modal:not(.credits-modal--open),
      .withdrawal-modal:not(.withdrawal-modal--open),
      .auth-modal:not(.auth-modal--open),
      .market-cart:not(.market-cart--open) {
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }

      .market-cart:not(.market-cart--open) .market-cart__backdrop {
        opacity: 0 !important;
      }

      .market-cart:not(.market-cart--open) .market-cart__panel {
        transform: translateX(100%) !important;
      }

      /* Open overlays: snap fully visible */
      .credits-modal--open,
      .credits-modal--open .credits-modal__panel,
      .withdrawal-modal--open,
      .withdrawal-modal--open .withdrawal-modal__panel,
      .auth-modal--open,
      .auth-modal--open .auth-modal__panel,
      .market-cart--open .market-cart__backdrop {
        opacity: 1 !important;
        transform: none !important;
        visibility: visible !important;
      }

      .market-cart--open .market-cart__panel {
        transform: translateX(0) !important;
        visibility: visible !important;
      }

      img, video, canvas {
        visibility: hidden !important;
      }
      [style*="background-image"] {
        background-image: none !important;
      }

      /* Card art */
      .card__art,
      .market-card__frame img,
      .collection-owned-card__frame img,
      .market-cart__thumb {
        visibility: hidden !important;
        background-image: none !important;
      }

      /* Card name + stats + domain/rarity chrome (inventory differs per account) */
      .card__title,
      .card__footer,
      .card__stat,
      .card__stat-value,
      .card__domain,
      .card__rarity,
      .card__overlay,
      .card__combat-stats,
      .card__bottom {
        visibility: hidden !important;
      }

      /* Market card foot meta (rarity / domain labels) */
      .market-card__meta,
      .market-card__rarity,
      .market-card__domain {
        visibility: hidden !important;
      }

      /* Cash + credit prices */
      .market-card__price,
      .market-card__price--credits,
      .market-card__price--money,
      .player-listing-card__price-display,
      .market-cart__line-price,
      .market-cart__line-credits {
        visibility: hidden !important;
      }

      /* Counts / inventory badges (not loading status — that must stay visible for waits) */
      .portal-market__count,
      .portal-collection__stats,
      .portal-collection__empty,
      .collection-owned-card__owned-badge,
      .collection-owned-card__qty-value,
      .portal-collection__deck-row-title,
      .portal-collection__deck-row-qty,
      .portal-collection__deck-count {
        visibility: hidden !important;
      }

      /*
       * Market card grid — always collapsed for visuals.
       * Avoids voidborn/komorebi races (empty vs loaded catalog).
       * Chrome (tabs, filters, toolbar) still compared.
       */
      .portal-market-grid,
      .portal-market-grid__loading,
      .portal-market__load-more {
        display: none !important;
      }
    `,
  })
}

/** Collection finished loading — real layout or a non-loading status (e.g. no decks). */
export async function waitForCollectionReady(page: Page, timeout = 90_000): Promise<void> {
  const ready = page
    .locator('.portal-collection')
    .or(page.locator('.portal-collection__status').filter({ hasNotText: 'Loading' }))
  await expect(ready.first()).toBeVisible({ timeout })
  // Let card frames paint after inventory swap (avoids empty-vs-grid snapshot races)
  await page.waitForTimeout(750)
}

/** Market chrome ready — card grid is CSS-hidden, do not wait for catalog. */
export async function waitForMarketReady(page: Page, timeout = 90_000): Promise<void> {
  await expect(page.locator('.portal-market')).toBeVisible({ timeout })
  await expect(page.locator('.portal-market__toolbar')).toBeVisible({ timeout })
}

/** Close cart drawer / credits / withdraw / account menu if left open between steps. */
export async function closePortalOverlays(page: Page): Promise<void> {
  if (await page.locator('.market-cart--open').count()) {
    await page.locator('.market-cart__close').click()
    await page.locator('.market-cart--open').waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {})
  }

  if (await page.locator('.credits-modal--open').count()) {
    await page.locator('.credits-modal--open .credits-modal__close').click()
    await page.locator('.credits-modal--open').waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {})
  }

  if (await page.locator('.withdrawal-modal--open').count()) {
    await page.locator('.withdrawal-modal--open .withdrawal-modal__close').click()
    await page.locator('.withdrawal-modal--open').waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {})
  }

  if (await page.locator('.portal__account-menu').isVisible().catch(() => false)) {
    await page.getByRole('button', { name: 'Account menu' }).click()
    await page.locator('.portal__account-menu').waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {})
  }
}
