import { appConfig } from '@/config'
import './PortalComingSoon.css'

type PortalComingSoonProps = {
  sectionTitle: string
}

export default function PortalComingSoon({ sectionTitle }: PortalComingSoonProps) {
  return (
    <div className="portal-coming-soon" role="status">
      <div className="portal-coming-soon__frame">
        <p className="portal-coming-soon__eyebrow">{sectionTitle}</p>
        <h2 className="portal-coming-soon__title">Coming Soon</h2>
        <p className="portal-coming-soon__text">
          {appConfig.descriptions.portal.comingSoon}
        </p>
      </div>
    </div>
  )
}
