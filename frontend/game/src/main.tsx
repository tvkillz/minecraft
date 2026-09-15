import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { applyTheme } from '@/config'
import { loadFonts } from '@/config/loadFonts'
import { prefetchCardCatalog } from '@/hooks/useCardCatalog'
import AuthGate from '@/components/auth/AuthGate'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { WalletProvider } from '@/hooks/useWallet'
import PlayPage from '@/screens/PlayPage/PlayPage'
import '@/index.css'
import '@/components/ui/Button/Button.css'

loadFonts()
applyTheme()
void prefetchCardCatalog()

const root = document.getElementById('root')
if (!root) {
  throw new Error('Game mount point #root not found')
}

createRoot(root).render(
  <StrictMode>
    <AuthProvider>
      <AuthGate>
        <WalletProvider>
          <PlayPage />
        </WalletProvider>
      </AuthGate>
    </AuthProvider>
  </StrictMode>,
)
