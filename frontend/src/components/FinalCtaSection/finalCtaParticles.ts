import { appConfig } from '@/config'

const PARTICLE_COUNT = 16

export const FINAL_CTA_PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
  const r1 = ((i * 67 + 11) % 100) / 100
  const r2 = ((i * 41 + 23) % 100) / 100
  const r3 = ((i * 83 + 5) % 100) / 100
  const r4 = ((i * 53 + 37) % 100) / 100
  const r5 = ((i * 29 + 61) % 100) / 100
  const [c0, c1] = appConfig.theme.particles.colors

  return {
    id: i,
    left: 4 + r1 * 92,
    size: 2 + r2 * 4,
    delay: r3 * 10,
    duration: 14 + r4 * 12,
    drift: -30 + r5 * 60,
    color: i % 2 === 0 ? c0 : c1,
  }
})
