import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const CONTENTGEN_ROOT = path.resolve(__dirname, '../..')
export const REPO_ROOT = path.resolve(CONTENTGEN_ROOT, '..')
export const PROJECTS_ROOT = path.join(REPO_ROOT, 'projects')

export function resolveProjectId(argv = process.argv) {
  const flag = argv.find((a) => a.startsWith('--project='))
  if (flag) return flag.slice('--project='.length)
  return process.env.CONTENTGEN_PROJECT || 'coop'
}

export function projectPaths(projectId) {
  const root = path.join(PROJECTS_ROOT, projectId)
  return {
    root,
    contentgen: path.join(root, 'contentgen.json'),
    manifest: path.join(root, 'manifest.json'),
    scenes: path.join(root, 'game/scenes.json'),
    domains: path.join(root, 'game/domains.json'),
    locations: path.join(root, 'game/locations.json'),
    cities: path.join(root, 'game/cities.json'),
    cards: path.join(root, 'game/cards.json'),
    pathways: path.join(root, 'copy/pathways.json'),
    gamemodel: path.join(root, 'copy/gamemodel.json'),
    collection: path.join(root, 'copy/collection.json'),
    assets: path.join(root, 'assets'),
    stagingRoot: path.join(root, 'assets/_staging/contentgen'),
    stagingManifest: path.join(root, 'assets/_staging/contentgen/manifest.json'),
    stagingImages: path.join(root, 'assets/_staging/contentgen/images'),
  }
}
