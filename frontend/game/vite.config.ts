import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const require = createRequire(import.meta.url)
const { projectWebpackAliases } = require('../scripts/project-next.mjs')

const gameDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(gameDir, '..')

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, repoRoot, 'NEXT_PUBLIC_')
  const projectId = process.env.PROJECT || 'voidborn'
  const playOutDir =
    process.env.VITE_PLAY_OUT_DIR || path.resolve(repoRoot, '.build', projectId, 'play')
  const projectAliases = projectWebpackAliases(projectId, repoRoot)

  return {
    root: gameDir,
    envDir: repoRoot,
    envPrefix: ['NEXT_PUBLIC_'],
    define: {
      'process.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(env.NEXT_PUBLIC_SUPABASE_URL ?? ''),
      'process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(
        env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
      ),
      'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(
        env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
      ),
    },
    plugins: [react()],
    base: '/play/',
    build: {
      outDir: playOutDir,
      emptyOutDir: true,
      manifest: true,
      rollupOptions: {
        input: path.resolve(gameDir, 'index.html'),
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(repoRoot, 'src'),
        ...projectAliases,
        'next/link': path.resolve(gameDir, 'shims/next-link.tsx'),
        'next/navigation': path.resolve(gameDir, 'shims/next-navigation.tsx'),
      },
    },
  }
})
