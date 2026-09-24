import dynamic from 'next/dynamic'
import { LandingHeader, LandingHero, LandingLocations } from '@/components/landing/resolveLanding'
import '@/components/landing/landing-interaction.css'
import { appConfig } from '@/config'

const DominionsSection = dynamic(
  () => import('@/components/DominionsSection/DominionsSection'),
  { ssr: true },
)
const FinalWhistleDominionsSection = dynamic(
  () => import('@/components/landing/final_whistle/FinalWhistleDominionsSection'),
  { ssr: true },
)
const WildreachFieldSurvey = dynamic(
  () => import('@/components/landing/wildreach/WildreachFieldSurvey'),
  { ssr: true },
)

const GameModelSection = dynamic(
  () => import('@/components/GameModelSection/GameModelSection'),
  { ssr: true },
)
const FinalWhistleGameModelSection = dynamic(
  () => import('@/components/landing/final_whistle/FinalWhistleGameModelSection'),
  { ssr: true },
)
const WildreachHuntProtocol = dynamic(
  () => import('@/components/landing/wildreach/WildreachHuntProtocol'),
  { ssr: true },
)

const WildreachCatalog = dynamic(
  () => import('@/components/landing/wildreach/WildreachCatalog'),
  { ssr: true },
)

const FinalWhistleCatalogSection = dynamic(
  () => import('@/components/landing/final_whistle/FinalWhistleCatalogSection'),
  { ssr: true },
)

const FinalWhistlePathwaysSection = dynamic(
  () => import('@/components/landing/final_whistle/FinalWhistlePathwaysSection'),
  { ssr: true },
)

const WildreachPathways = dynamic(
  () => import('@/components/landing/wildreach/WildreachPathways'),
  { ssr: true },
)

const CollectionSection = dynamic(
  () => import('@/components/CollectionSection/CollectionSection'),
  { ssr: true },
)

const PathwaysSection = dynamic(
  () => import('@/components/PathwaysSection/PathwaysSection'),
  { ssr: true },
)

const FaqSection = dynamic(() => import('@/components/FaqSection/FaqSection'), { ssr: true })

const FinalWhistleFaqSection = dynamic(
  () => import('@/components/landing/final_whistle/FinalWhistleFaqSection'),
  { ssr: true },
)

const FinalWhistleShapeSection = dynamic(
  () => import('@/components/landing/final_whistle/FinalWhistleShapeSection'),
  { ssr: true },
)

const FinalCtaSection = dynamic(
  () => import('@/components/FinalCtaSection/FinalCtaSection'),
  { ssr: true },
)

const Footer = dynamic(() => import('@/components/Footer/Footer'), { ssr: true })

const MinecraftLanding = dynamic(
  () => import('@/components/landing/minecraft/MinecraftLanding'),
  { ssr: true },
)

export default function HomePage() {
  const variant = appConfig.landing?.variant
  const isFinalWhistle = variant === 'final_whistle'
  const isWildreach = variant === 'wildreach'
  const isMinecraft = variant === 'minecraft'

  return (
    <div className="app">
      <LandingHeader />
      <main className="landing-flow">
        <LandingHero />
        {isMinecraft ? <MinecraftLanding /> : <LandingLocations />}
        {isMinecraft ? null : isFinalWhistle ? (
          <FinalWhistleDominionsSection />
        ) : isWildreach ? (
          <WildreachFieldSurvey />
        ) : (
          <DominionsSection />
        )}
        {isMinecraft ? null : isFinalWhistle ? (
          <FinalWhistleGameModelSection />
        ) : isWildreach ? (
          <WildreachHuntProtocol />
        ) : (
          <GameModelSection />
        )}
        {isMinecraft ? null : isFinalWhistle ? (
          <FinalWhistleCatalogSection />
        ) : isWildreach ? (
          <WildreachCatalog />
        ) : (
          <CollectionSection />
        )}
        {isMinecraft ? null : isFinalWhistle ? (
          <FinalWhistlePathwaysSection />
        ) : isWildreach ? (
          <WildreachPathways />
        ) : (
          <PathwaysSection />
        )}
        {isMinecraft ? null : isFinalWhistle ? <FinalWhistleFaqSection /> : <FaqSection />}
        {isMinecraft ? null : isFinalWhistle ? <FinalWhistleShapeSection /> : <FinalCtaSection />}
      </main>
      <Footer />
    </div>
  )
}
