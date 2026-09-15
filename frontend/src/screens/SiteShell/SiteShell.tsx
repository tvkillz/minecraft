'use client'

import Footer from '@/components/Footer/Footer'
import { WalletProvider } from '@/hooks/useWallet'
import PortalHeader from '@/screens/Portal/PortalHeader'
import '@/screens/Portal/PortalShell.css'

type SiteShellProps = {
  children: React.ReactNode
}

/** Shared site chrome: portal header, main padding, footer, void background. */
export default function SiteShell({ children }: SiteShellProps) {
  return (
    <WalletProvider>
      <div className="portal">
        <PortalHeader />
        <main className="portal__main">{children}</main>
        <div className="portal__footer">
          <Footer />
        </div>
      </div>
    </WalletProvider>
  )
}
