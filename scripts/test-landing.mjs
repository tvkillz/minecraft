#!/usr/bin/env node
/**
 * Local landing gate (repo root):
 *   1) BUILD_SCOPE=landing for voidborn + iyashikei
 *   2) start production servers on registry ports
 *   3) playwright tests/landing
 *   4) stop servers (process group + port fallback — no orphan next-server)
 *
 *   node scripts/test-landing.mjs
 *   npm run test:landing
 */
import { spawn, spawnSync } from 'node:child_process'
import http from 'node:http'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const frontendDir = path.join(root, 'frontend')
const uiTestsDir = path.join(root, 'ui-tests')

/** Sites under test — project2 excluded. Ports = 3100 + registry index. */
const SITES = [
  { id: 'voidborn', port: 3100 },
  { id: 'iyashikei', port: 3102 },
]

const children = []

function log(msg) {
  console.log(`[test:landing] ${msg}`)
}

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, {
    stdio: 'inherit',
    ...opts,
  })
  if (result.status !== 0) {
    throw new Error(`${cmd} ${args.join(' ')} exited ${result.status ?? 'signal'}`)
  }
}

function waitForHttp(port, { timeoutMs = 120_000, intervalMs = 500 } = {}) {
  const deadline = Date.now() + timeoutMs
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      const req = http.get({ host: '127.0.0.1', port, path: '/', timeout: 3000 }, (res) => {
        res.resume()
        if (res.statusCode && res.statusCode < 500) {
          resolve(res.statusCode)
          return
        }
        if (Date.now() > deadline) {
          reject(new Error(`http://127.0.0.1:${port}/ still ${res.statusCode}`))
          return
        }
        setTimeout(tryOnce, intervalMs)
      })
      req.on('error', () => {
        if (Date.now() > deadline) {
          reject(new Error(`Timed out waiting for http://127.0.0.1:${port}/`))
          return
        }
        setTimeout(tryOnce, intervalMs)
      })
    }
    tryOnce()
  })
}

function portFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer()
    server.once('error', () => resolve(false))
    server.once('listening', () => {
      server.close(() => resolve(true))
    })
    server.listen(port, '127.0.0.1')
  })
}

async function waitPortFree(port, timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await portFree(port)) return
    await new Promise((r) => setTimeout(r, 150))
  }
}

function killProcessGroup(pid, signal) {
  if (!pid) return
  try {
    process.kill(-pid, signal)
  } catch {
    try {
      process.kill(pid, signal)
    } catch {
      /* already gone */
    }
  }
}

/** Last-resort: free listeners on the test ports (Linux). */
function killPortListeners(port) {
  spawnSync('fuser', ['-k', `${port}/tcp`], {
    stdio: 'ignore',
  })
}

function waitExit(child, timeoutMs) {
  if (child.exitCode != null || child.signalCode != null) {
    return Promise.resolve()
  }
  return new Promise((resolve) => {
    const onExit = () => {
      clearTimeout(timer)
      resolve()
    }
    const timer = setTimeout(() => {
      child.off('exit', onExit)
      resolve()
    }, timeoutMs)
    child.once('exit', onExit)
  })
}

function startProd(site) {
  log(`Starting ${site.id}-prod on :${site.port}`)
  // New process group so we can kill start-prod + next-server together.
  const child = spawn('node', ['scripts/start-prod.mjs'], {
    cwd: frontendDir,
    stdio: ['ignore', 'inherit', 'inherit'],
    detached: true,
    env: {
      ...process.env,
      PROJECT: site.id,
      PORT: String(site.port),
      HOSTNAME: '127.0.0.1',
      NODE_ENV: 'production',
      SITE_AUTH_DISABLED: '1',
      SITE_HYBRID: '1',
      NEXT_PUBLIC_SITE_HYBRID: '1',
    },
  })
  children.push({ site, child })
  child.on('exit', (code, signal) => {
    if (code || signal) {
      log(`${site.id}-prod exited code=${code} signal=${signal}`)
    }
  })
}

async function stopAll() {
  const batch = children.splice(0)
  await Promise.all(
    batch.map(async ({ site, child }) => {
      log(`Stopping ${site.id}-prod`)
      if (child.exitCode == null && child.signalCode == null) {
        killProcessGroup(child.pid, 'SIGTERM')
        await waitExit(child, 5000)
      }
      if (child.exitCode == null && child.signalCode == null) {
        killProcessGroup(child.pid, 'SIGKILL')
        await waitExit(child, 2000)
      }
      killPortListeners(site.port)
      await waitPortFree(site.port, 5000)
      if (!(await portFree(site.port))) {
        log(`WARNING: port ${site.port} still in use after stop`)
      } else {
        log(`${site.id}-prod port ${site.port} free`)
      }
    }),
  )
}

async function freeStalePorts() {
  for (const site of SITES) {
    if (await portFree(site.port)) continue
    log(`Clearing stale listener on :${site.port}`)
    killPortListeners(site.port)
    await waitPortFree(site.port, 5000)
  }
}

async function main() {
  let stopping = false
  const onSignal = async (code) => {
    if (stopping) return
    stopping = true
    await stopAll()
    process.exit(code)
  }
  process.on('SIGINT', () => {
    void onSignal(130)
  })
  process.on('SIGTERM', () => {
    void onSignal(143)
  })

  try {
    await freeStalePorts()

    for (const site of SITES) {
      log(`Building landing: ${site.id}`)
      run('npm', ['run', 'build', '--', '--only-landing'], {
        cwd: frontendDir,
        env: {
          ...process.env,
          PROJECT: site.id,
          BUILD_SCOPE: 'landing',
        },
      })
    }

    for (const site of SITES) {
      startProd(site)
    }

    for (const site of SITES) {
      log(`Waiting for http://127.0.0.1:${site.port}/`)
      const status = await waitForHttp(site.port)
      log(`${site.id} ready (HTTP ${status})`)
    }

    log('Running Playwright: tests/landing')
    run('npx', ['playwright', 'test', 'tests/landing'], {
      cwd: uiTestsDir,
    })

    log('OK')
  } finally {
    await stopAll()
  }
}

main().catch(async (err) => {
  console.error(`[test:landing] ${err.message || err}`)
  await stopAll()
  process.exit(1)
})
