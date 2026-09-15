import { notFound } from 'next/navigation'

import LegalDocument from '@/components/legal/LegalDocument'
import { appConfig } from '@/config'
import '@/components/legal/LegalDocument.css'

export default function CookiePolicyPage() {
  const document = appConfig.legal?.cookies
  if (!document) notFound()

  return <LegalDocument document={document} />
}
