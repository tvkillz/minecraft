import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { getCredentials } from './env'
import type { PortalSite } from './sites'
import { stabilizePage } from './stabilize'

/** Sign in via PortalAuthGate + AuthModal; leaves an authenticated portal shell. */
export async function loginToPortal(page: Page, site: PortalSite): Promise<void> {
  const creds = getCredentials(site.authSuffix)
  if (!creds) {
    throw new Error(
      `Missing UI_TEST_EMAIL / UI_TEST_PASSWORD in ui-tests/.env (needed for ${site.name})`,
    )
  }

  const target = `${site.url}/portal/market`
  const response = await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  if (response && response.status() >= 400) {
    throw new Error(`GET ${target} returned HTTP ${response.status()} — is ${site.name} running?`)
  }

  // Wait for client portal shell / auth gate to hydrate before stabilizing.
  const portal = page.locator('.portal')
  const gate = page.locator('.auth-gate')
  try {
    await expect(portal.or(gate)).toBeVisible({ timeout: 90_000 })
  } catch (err) {
    const title = await page.title().catch(() => '')
    const body = await page.locator('body').innerText().catch(() => '')
    throw new Error(
      `Neither .portal nor .auth-gate on ${target} (title=${JSON.stringify(title)}). ` +
        `Is the site up on ${site.url}? Body starts: ${JSON.stringify(body.slice(0, 240))}`,
      { cause: err },
    )
  }

  await stabilizePage(page)

  if (await gate.isVisible()) {
    await gate.getByRole('button', { name: 'Sign In' }).click()
    const modal = page.locator('.auth-modal--open')
    await expect(modal).toBeVisible({ timeout: 30_000 })

    await modal.getByLabel('Email', { exact: true }).fill(creds.email)
    await modal.getByLabel('Password', { exact: true }).fill(creds.password)
    await modal.locator('.auth-modal__submit').click()
  }

  await expect(portal).toBeVisible({ timeout: 90_000 })
  await expect(page.locator('.portal__tabs')).toBeVisible()
}
