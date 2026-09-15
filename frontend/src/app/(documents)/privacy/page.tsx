import { notFound } from 'next/navigation'

import LegalDocument from '@/components/legal/LegalDocument'
import { appConfig } from '@/config'
import '@/components/legal/LegalDocument.css'

export default function PrivacyPage() {
  const document = appConfig.legal?.privacy
  if (!document) notFound()

  return <LegalDocument document={document} />
}
