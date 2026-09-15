import { redirect } from 'next/navigation'
import { appConfig } from '@/config'

export default function MarketRedirectPage() {
  redirect(appConfig.domain.routes.portalMarket)
}
