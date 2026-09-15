import Footer from '@/components/Footer/Footer'
import { LandingHeader } from '@/components/landing/resolveLanding'

export default function TutorialLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="app">
      <LandingHeader />
      <main className="landing-flow tutorial-page">{children}</main>
      <Footer />
    </div>
  )
}
