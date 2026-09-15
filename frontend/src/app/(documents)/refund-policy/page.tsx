import { notFound } from 'next/navigation'

import LegalDocument from '@/components/legal/LegalDocument'
import { appConfig } from '@/config'
import '@/components/legal/LegalDocument.css'

export default function RefundPolicyPage() {
  const document = appConfig.legal?.refund
  if (!document) notFound()

  return <LegalDocument document={document} />
}
