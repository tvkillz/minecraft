import SiteShell from '@/screens/SiteShell/SiteShell'

export default function DocumentsLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <SiteShell>{children}</SiteShell>
}
