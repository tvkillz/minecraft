import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const CARDGEN_ROOT = path.resolve(__dirname, '../..')
export const REPO_ROOT = path.resolve(CARDGEN_ROOT, '..')
export const PROJECTS_ROOT = path.join(REPO_ROOT, 'projects')

export function resolveProjectId(argv = process.argv) {
  const flag = argv.find((a) => a.startsWith('--project='))
  if (flag) return flag.slice('--project='.length)
  return process.env.CARDGEN_PROJECT || 'coop'
}

export function projectPaths(projectId) {
  const root = path.join(PROJECTS_ROOT, projectId)
  return {
    root,
    cardgen: path.join(root, 'cardgen.json'),
    gameCards: path.join(root, 'game/cards.json'),
    domains: path.join(root, 'game/domains.json'),
    keywords: path.join(root, 'game/keywords.json'),
    rarities: path.join(root, 'game/rarities.json'),
    dominions: path.join(root, 'copy/dominions.json'),
    assets: path.join(root, 'assets'),
    stagingCards: path.join(root, 'game/_staging/cards'),
    stagingApproved: path.join(root, 'game/_staging/cards/approved'),
    stagingRounds: path.join(root, 'game/_staging/rounds'),
    stagingImages: path.join(root, 'game/_staging/images'),
    stagingManifests: path.join(root, 'game/_staging/image-manifests'),
    stagingShowcase: path.join(root, 'game/_staging/showcase'),
    locations: path.join(root, 'game/locations.json'),
    collection: path.join(root, 'copy/collection.json'),
  }
}

export function roundDir(paths, roundId) {
  return path.join(paths.stagingRounds, roundId)
}

export function roundManifestPath(paths, roundId) {
  return path.join(roundDir(paths, roundId), 'round.json')
}
