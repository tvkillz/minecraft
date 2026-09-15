import { notFound } from 'next/navigation'

import LegalDocument from '@/components/legal/LegalDocument'
import { appConfig } from '@/config'
import '@/components/legal/LegalDocument.css'

export default function TermsPage() {
  const document = appConfig.legal?.terms
  if (!document) notFound()

  return <LegalDocument document={document} />
}
