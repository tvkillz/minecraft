import { redirect } from 'next/navigation'
import { appConfig } from '@/config'

export default function ProfileRedirectPage() {
  redirect(appConfig.domain.routes.portalProfile)
}
