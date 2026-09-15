import { redirect } from 'next/navigation'
import { appConfig } from '@/config'

export default function PortalIndexPage() {
  redirect(appConfig.domain.routes.portalMarket)
}
