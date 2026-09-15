'use client'

import { HERO_CARDS } from '@/config'
import CardPlaceholder from '../CardPlaceholder/CardPlaceholder'
import HeroCtas from './HeroCtas'

/** CTAs + card fan — split from Hero so media hydrates in a separate client chunk. */
export default function HeroInteractive() {
  return (
    <>
      <HeroCtas />
      <CardPlaceholder cards={HERO_CARDS} layoutMode="hero" />
    </>
  )
}
