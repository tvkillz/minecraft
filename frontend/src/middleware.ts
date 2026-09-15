import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const USER = process.env.SITE_AUTH_USERNAME ?? 'dev'
const PASS = process.env.SITE_AUTH_PASSWORD ?? 'dev'
const DISABLED = process.env.SITE_AUTH_DISABLED === '1'

function authorized(request: NextRequest): boolean {
  const header = request.headers.get('authorization')
  if (!header?.startsWith('Basic ')) return false

  const encoded = header.slice(6)
  let decoded: string
  try {
    decoded = atob(encoded)
  } catch {
    return false
  }

  const colon = decoded.indexOf(':')
  if (colon === -1) return false

  return decoded.slice(0, colon) === USER && decoded.slice(colon + 1) === PASS
}

export function middleware(request: NextRequest) {
  if (DISABLED || !USER || !PASS) {
    return NextResponse.next()
  }

  if (authorized(request)) {
    return NextResponse.next()
  }

  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Site"' },
  })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|favicon\\.png|favicon\\.svg|apple-touch-icon\\.png|og-image\\.jpg|icon|auth/v1|rest/v1|functions/v1|storage/v1|realtime/v1).*)',
  ],
}
