import { mkdir, readFile, writeFile, access } from 'node:fs/promises'
import path from 'node:path'

export async function ensureDir(dir) {
  await mkdir(dir, { recursive: true })
}

export async function readJsonFile(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'))
}

export async function writeJsonFile(filePath, data) {
  await ensureDir(path.dirname(filePath))
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

export async function fileExists(p) {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

export function parseArgs(argv) {
  const positional = []
  const flags = {}
  for (const arg of argv.slice(2)) {
    if (arg.startsWith('--')) {
      const eq = arg.indexOf('=')
      if (eq === -1) {
        flags[arg.slice(2)] = true
      } else {
        flags[arg.slice(2, eq)] = arg.slice(eq + 1)
      }
    } else {
      positional.push(arg)
    }
  }
  return { positional, flags }
}
