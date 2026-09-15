import { appConfig } from '@/config'
import './styles.css'

export default function CollectionsPage() {
  return (
    <section className="collections-page">
      <h1>Manage Decks</h1>
      <p>{appConfig.descriptions.collections}</p>
    </section>
  )
}
