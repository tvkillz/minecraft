import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const SOCGEN_ROOT = path.resolve(__dirname, '../..')
export const REPO_ROOT = path.resolve(SOCGEN_ROOT, '..')
export const PROJECTS_ROOT = path.join(REPO_ROOT, 'projects')

export function resolveProjectId(argv = process.argv) {
  const flag = argv.find((a) => a.startsWith('--project='))
  if (flag) return flag.slice('--project='.length)
  return process.env.SOCGEN_PROJECT || 'voidborn'
}

export function projectPaths(projectId) {
  const root = path.join(PROJECTS_ROOT, projectId)
  const socialRoot = path.join(root, 'social')
  return {
    root,
    manifest: path.join(root, 'manifest.json'),
    cardgen: path.join(root, 'cardgen.json'),
    socialgen: path.join(root, 'socialgen.json'),
    gameCards: path.join(root, 'game/cards.json'),
    domains: path.join(root, 'game/domains.json'),
    scenes: path.join(root, 'game/scenes.json'),
    dominions: path.join(root, 'copy/dominions.json'),
    pathways: path.join(root, 'copy/pathways.json'),
    descriptions: path.join(root, 'copy/descriptions.json'),
    seo: path.join(root, 'copy/seo.json'),
    colors: path.join(root, 'theme/colors.json'),
    assets: path.join(root, 'assets'),
    socialRoot,
    socialStaging: path.join(socialRoot, '_staging'),
    socialPosts: path.join(socialRoot, 'posts'),
    cardLog: path.join(socialRoot, 'card-log.json'),
  }
}

export function postDir(root, postId) {
  return path.join(root, postId)
}

export function postJsonPath(root, postId) {
  return path.join(postDir(root, postId), 'post.json')
}

export function postImagePath(root, postId) {
  return path.join(postDir(root, postId), 'image.png')
}

export const POST_ID_RE = /^post\d+$/
export const IMAGE_SIZE = 1080
