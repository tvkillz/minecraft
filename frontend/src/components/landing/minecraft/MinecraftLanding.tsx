import MinecraftCatalog from './MinecraftCatalog'
import MinecraftFaq from './MinecraftFaq'
import MinecraftPerks from './MinecraftPerks'
import MinecraftSupport from './MinecraftSupport'
import './sections.css'

export default function MinecraftLanding() {
  return (
    <>
      <MinecraftPerks />
      <MinecraftCatalog />
      <MinecraftFaq />
      <MinecraftSupport />
    </>
  )
}
