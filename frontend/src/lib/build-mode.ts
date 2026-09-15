/** True when /play is the Vite bundle and the rest is Next (prod hybrid). */
export function isHybridProduction(): boolean {
  return (
    process.env.SITE_HYBRID === '1' ||
    process.env.NEXT_PUBLIC_SITE_HYBRID === '1' ||
    process.env.VOIDBORN_HYBRID === '1' ||
    process.env.NEXT_PUBLIC_VOIDBORN_HYBRID === '1'
  )
}
