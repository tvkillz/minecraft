import path from 'node:path'

export type UiTestSite = {
  /** Label in test titles + snapshot filenames */
  name: string
  /** Local start:prod URL — ports are typically 3100 + projects/registry index */
  url: string
  /**
   * Auth email plus-tag (siteId / authEmailSuffix).
   */
  authSuffix: string
  /** Playwright storageState path (Supabase session in localStorage) */
  authFile: string
}

const authDir = path.join(__dirname, '..', '.auth')

/**
 * Single registry for landing + portal UI tests.
 * Add a new store here — both suites pick it up.
 */
export const UI_TEST_SITES: UiTestSite[] = [
  {
    name: 'coop',
    url: 'http://127.0.0.1:3100',
    authSuffix: 'coop',
    authFile: path.join(authDir, 'coop.json'),
  },
]

/** @deprecated Prefer UI_TEST_SITES — kept for existing portal imports */
export const PORTAL_SITES = UI_TEST_SITES

export type PortalSite = UiTestSite
