import { redirect } from 'next/navigation'

import { appConfig } from '@/config'

/** Store tab removed — send old links to the market. */
export default function PortalStorePage() {
  redirect(appConfig.domain.routes.portalMarket)
}
