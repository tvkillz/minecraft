import Header from '@/components/Header/Header'
import Hero from '@/components/Hero/Hero'
import FinalWhistleHeader from '@/components/landing/final_whistle/FinalWhistleHeader'
import FinalWhistleHero from '@/components/landing/final_whistle/FinalWhistleHero'
import FinalWhistlePressureMap from '@/components/landing/final_whistle/FinalWhistlePressureMap'
import HelixHeader from '@/components/landing/helix/HelixHeader'
import HelixHero from '@/components/landing/helix/HelixHero'
import HelixLocations from '@/components/landing/helix/HelixLocations'
import IyashikeiHeader from '@/components/landing/iyashikei/IyashikeiHeader'
import IyashikeiHero from '@/components/landing/iyashikei/IyashikeiHero'
import WildreachHeader from '@/components/landing/wildreach/WildreachHeader'
import WildreachHero from '@/components/landing/wildreach/WildreachHero'
import WildreachRangeAtlas from '@/components/landing/wildreach/WildreachRangeAtlas'
import MinecraftHero from '@/components/landing/minecraft/MinecraftHero'
import LocationsSection from '@/components/LocationsSection/LocationsSection'
import { appConfig } from '@/config'

/** Project landing shell — Header + Hero (+ Locations for helix) swap by variant. */
export function LandingHeader() {
  const variant = appConfig.landing?.variant
  if (variant === 'final_whistle') return <FinalWhistleHeader />
  if (variant === 'iyashikei') return <IyashikeiHeader />
  if (variant === 'helix') return <HelixHeader />
  if (variant === 'wildreach') return <WildreachHeader />
  return <Header />
}

export function LandingHero() {
  const variant = appConfig.landing?.variant
  if (variant === 'final_whistle') return <FinalWhistleHero />
  if (variant === 'iyashikei') return <IyashikeiHero />
  if (variant === 'helix') return <HelixHero />
  if (variant === 'wildreach') return <WildreachHero />
  if (variant === 'minecraft') return <MinecraftHero />
  return <Hero />
}

export function LandingLocations() {
  if (appConfig.landing?.variant === 'final_whistle') return <FinalWhistlePressureMap />
  if (appConfig.landing?.variant === 'helix') return <HelixLocations />
  if (appConfig.landing?.variant === 'wildreach') return <WildreachRangeAtlas />
  return <LocationsSection />
}
