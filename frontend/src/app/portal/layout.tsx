import PortalShell from '@/screens/Portal/PortalShell'

export default function PortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <PortalShell>{children}</PortalShell>
}
