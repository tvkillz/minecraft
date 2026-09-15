import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildPaths, projectRoot, resolveProjectId } from './project-paths.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const FRONTEND_ROOT = path.resolve(__dirname, '..')

export function getProjectId(env = process.env) {
  return env.PROJECT || 'voidborn'
}

export function projectDistDir(projectId = getProjectId()) {
  return `.build/${projectId}/.next`
}

/** Static export output when distDir is customized (output: 'export' writes into distDir). */
export function staticExportDir(projectId = getProjectId(), root = FRONTEND_ROOT) {
  return path.join(root, projectDistDir(projectId))
}

export function projectWebpackAliases(projectId = getProjectId(), root = FRONTEND_ROOT) {
  const out = buildPaths(projectId)
  return {
    '@project/bundle': path.join(out.generated, 'project-bundle.json'),
    '@project/game-config': path.join(out.generated, 'game-config.json'),
    '@project/cards-catalog': path.join(out.data, 'cards-catalog.json'),
    '@project/landing-cards': path.join(out.data, 'landing-cards.json'),
    '@project/bot-nicknames': path.join(projectRoot(projectId), 'game/bot-nicknames.json'),
  }
}

export { resolveProjectId, buildPaths }
