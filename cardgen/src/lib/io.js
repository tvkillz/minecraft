import { mkdir, readFile, writeFile, rename, readdir } from 'node:fs/promises'
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

export function batchFileName(domain, startIndex, count) {
  const pad = (n) => String(n).padStart(2, '0')
  const end = startIndex + count - 1
  return `${domain}_batch_${pad(startIndex)}-${pad(end)}.json`
}

export async function listJsonFiles(dir) {
  try {
    const names = await readdir(dir)
    return names.filter((n) => n.endsWith('.json')).map((n) => path.join(dir, n))
  } catch {
    return []
  }
}

export async function moveToApproved(filePath, approvedDir) {
  await ensureDir(approvedDir)
  const dest = path.join(approvedDir, path.basename(filePath))
  await rename(filePath, dest)
  return dest
}
