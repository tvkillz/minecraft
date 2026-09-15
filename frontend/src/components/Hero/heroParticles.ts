import { appConfig } from '@/config'

const PARTICLE_COUNT = 20

export const HERO_PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
  const r1 = ((i * 73 + 17) % 100) / 100
  const r2 = ((i * 47 + 31) % 100) / 100
  const r3 = ((i * 91 + 7) % 100) / 100
  const r4 = ((i * 59 + 43) % 100) / 100
  const r5 = ((i * 37 + 53) % 100) / 100
  const [c0, c1] = appConfig.theme.particles.colors

  return {
    id: i,
    left: 2 + r1 * 96,
    size: 2 + r2 * 5,
    delay: r3 * 14,
    duration: 12 + r4 * 16,
    drift: -40 + r5 * 80,
    color: i % 3 === 0 ? c0 : c1,
  }
})
