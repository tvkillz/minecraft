import { notFound } from 'next/navigation'

import TutorialGuide from '@/components/TutorialGuide/TutorialGuide'
import { appConfig } from '@/config'

export default function TutorialPage() {
  const tutorial = appConfig.descriptions.tutorial
  if (!tutorial?.sections?.length) notFound()

  return <TutorialGuide />
}
