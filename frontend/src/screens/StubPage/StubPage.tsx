import { LandingHeader } from '@/components/landing/resolveLanding'
import './styles.css'

type StubPageProps = {
  title: string
  description: string
}

export default function StubPage({ title, description }: StubPageProps) {
  return (
    <div className="stub-page">
      <LandingHeader />
      <main className="stub-page__main">
        <h1>{title}</h1>
        <p>{description}</p>
      </main>
    </div>
  )
}
