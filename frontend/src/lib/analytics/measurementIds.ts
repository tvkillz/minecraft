/**
 * Per-site GA4 measurement IDs (one Google tag per site build).
 * Keyed by projects/{id} / appConfig.siteId.
 */
const GA_MEASUREMENT_IDS: Record<string, string> = {
  voidborn: 'G-DJLH87JLCH',
  helix: 'G-902HSECTH6',
  final_whistle: 'G-3N05NR0VGW',
  iyashikei: 'G-M61SFJ6YMG',
  wildreach: 'G-2PS2N5WCFM',
}

export function getGaMeasurementId(siteId: string): string | null {
  const id = GA_MEASUREMENT_IDS[siteId]
  return id && id.startsWith('G-') ? id : null
}
