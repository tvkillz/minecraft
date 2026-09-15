import { redirect } from 'next/navigation'
import PortalComingSoon from '@/screens/Portal/PortalComingSoon'
import { appConfig } from '@/config'

export default function PortalVaultsPage() {
  const section = appConfig.portal.sections.find((s) => s.id === 'vaults')
  if (!section) {
    redirect(appConfig.domain.routes.portalMarket)
  }
  return <PortalComingSoon sectionTitle={section.title} />
}
