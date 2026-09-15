import { notFound } from 'next/navigation'

import LegalDocument from '@/components/legal/LegalDocument'
import { appConfig } from '@/config'
import '@/components/legal/LegalDocument.css'

export default function DisclaimerPage() {
  const document = appConfig.legal?.disclaimer
  if (!document) notFound()

  return <LegalDocument document={document} />
}
