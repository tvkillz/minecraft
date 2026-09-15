import { test, expect } from '@playwright/test'
import { PORTAL_SITES } from '../../helpers/sites'
import {
  closePortalOverlays,
  stabilizePage,
  waitForCollectionReady,
  waitForMarketReady,
} from '../../helpers/stabilize'
import { portalDynamicMasks, portalScreenshotOptions } from '../../helpers/visual'

test.setTimeout(180_000)

async function openPortal(page: import('@playwright/test').Page, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await expect(page.locator('.portal')).toBeVisible({ timeout: 90_000 })
  await stabilizePage(page)
  await closePortalOverlays(page)
  await expect(page.locator('.portal__tabs')).toBeVisible()
}

function shotOpts(page: import('@playwright/test').Page) {
  return {
    ...portalScreenshotOptions,
    mask: portalDynamicMasks(page),
  }
}

for (const site of PORTAL_SITES) {
  test.describe(`${site.name} portal visual`, () => {
    test.use({
      baseURL: site.url,
      storageState: site.authFile,
      viewport: { width: 1280, height: 800 },
    })

    test('visual market', async ({ page }) => {
      await openPortal(page, '/portal/market')
      await waitForMarketReady(page)
      await closePortalOverlays(page)
      await expect(page).toHaveScreenshot(`${site.name}-market.png`, shotOpts(page))
    })

    test('visual credits modal', async ({ page }) => {
      await openPortal(page, '/portal/market')
      await closePortalOverlays(page)
      await page.locator('.portal__buy-credits-btn').click()
      await expect(page.locator('.credits-modal--open .credits-modal__panel')).toBeVisible()
      await expect(page).toHaveScreenshot(`${site.name}-credits-modal.png`, shotOpts(page))
    })

    test('visual withdraw modal', async ({ page }) => {
      await openPortal(page, '/portal/market')
      await closePortalOverlays(page)
      await page.getByRole('button', { name: 'WITHDRAW' }).click()
      await expect(page.locator('.withdrawal-modal--open .withdrawal-modal__panel')).toBeVisible()
      await expect(page).toHaveScreenshot(`${site.name}-withdraw-modal.png`, shotOpts(page))
    })

    test('visual cart drawer', async ({ page }) => {
      await openPortal(page, '/portal/market')
      await closePortalOverlays(page)
      await page.locator('.portal__cart-btn').click()
      await expect(page.locator('.market-cart--open .market-cart__panel')).toBeVisible()
      await expect(page).toHaveScreenshot(`${site.name}-cart-drawer.png`, shotOpts(page))
      await closePortalOverlays(page)
    })

    test('visual account menu', async ({ page }) => {
      await openPortal(page, '/portal/market')
      await closePortalOverlays(page)
      await page.getByRole('button', { name: 'Account menu' }).click()
      await expect(page.locator('.portal__account-menu')).toBeVisible()
      await expect(page).toHaveScreenshot(`${site.name}-account-menu.png`, shotOpts(page))
    })

    test('visual collection forge', async ({ page }) => {
      await openPortal(page, '/portal/collection')
      await waitForCollectionReady(page)
      const forgeBtn = page.locator('.portal__mode-btn', { hasText: 'Forge' })
      await forgeBtn.click()
      await expect(forgeBtn).toHaveAttribute('aria-pressed', 'true')
      await closePortalOverlays(page)
      await expect(page).toHaveScreenshot(`${site.name}-collection-forge.png`, shotOpts(page))
    })

    test('visual collection sell', async ({ page }) => {
      await openPortal(page, '/portal/collection')
      await waitForCollectionReady(page)
      const sellBtn = page.locator('.portal__mode-btn', { hasText: 'Sell' })
      await sellBtn.click()
      await expect(sellBtn).toHaveAttribute('aria-pressed', 'true')
      await closePortalOverlays(page)
      await expect(page).toHaveScreenshot(`${site.name}-collection-sell.png`, shotOpts(page))
    })

    test('visual transactions', async ({ page }) => {
      await openPortal(page, '/portal/transactions')
      await expect(page.locator('.portal-transactions')).toBeVisible({ timeout: 60_000 })
      await closePortalOverlays(page)
      await expect(page).toHaveScreenshot(`${site.name}-transactions.png`, shotOpts(page))
    })

    test('visual profile', async ({ page }) => {
      await openPortal(page, '/portal/profile')
      await expect(page.locator('.portal-profile')).toBeVisible({ timeout: 60_000 })
      await closePortalOverlays(page)
      await expect(page).toHaveScreenshot(`${site.name}-profile.png`, shotOpts(page))
    })
  })
}
