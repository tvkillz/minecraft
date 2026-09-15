import PortalShell from '@/screens/Portal/PortalShell'

export default function CheckoutLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <PortalShell>{children}</PortalShell>
}
