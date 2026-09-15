const ASSETS = '/assets'

export function assetPath(
  kind: 'logo' | 'video' | 'card' | 'location' | 'favicon',
  file: string,
): string {
  switch (kind) {
    case 'logo':
      return `${ASSETS}/logo.jpg`
    case 'video':
      return `${ASSETS}/main.mp4`
    case 'favicon':
      return '/favicon.png'
    case 'card':
      return `${ASSETS}/cards/${file}`
    case 'location':
      return `${ASSETS}/locations/${file}`
  }
}

export function locationImage(id: string): string {
  return assetPath('location', `${id}.jpg`)
}
