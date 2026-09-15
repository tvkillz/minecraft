import fs from 'node:fs'
import path from 'node:path'
import { test as setup } from '@playwright/test'
import { loginToPortal } from '../helpers/auth'
import { getCredentials } from '../helpers/env'
import { PORTAL_SITES } from '../helpers/sites'

const authDir = path.join(__dirname, '..', '.auth')

setup.setTimeout(180_000)

setup.beforeAll(() => {
  fs.mkdirSync(authDir, { recursive: true })
})

for (const site of PORTAL_SITES) {
  setup(`authenticate ${site.name}`, async ({ page }) => {
    if (!getCredentials(site.authSuffix)) {
      throw new Error(
        `Missing credentials for ${site.name}. Copy ui-tests/.env.example → ui-tests/.env and set UI_TEST_EMAIL + UI_TEST_PASSWORD.`,
      )
    }

    await loginToPortal(page, site)
    await page.context().storageState({ path: site.authFile })
  })
}
