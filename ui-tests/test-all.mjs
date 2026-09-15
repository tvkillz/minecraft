#!/usr/bin/env node
/**
 * Run landing + portal UI tests for every site in helpers/sites.ts.
 *
 * Prerequisites:
 *   - Sites already serving on their configured URLs (see README.md)
 *   - ui-tests/.env with UI_TEST_EMAIL + UI_TEST_PASSWORD (portal auth)
 *
 * Usage (from ui-tests/):
 *   node test-all.mjs
 *   node test-all.mjs --update          # refresh landing + portal visual baselines
 *   node test-all.mjs --landing-only
 *   node test-all.mjs --portal-only
 *   node test-all.mjs -g voidborn       # filter by site / test name
 *   node test-all.mjs --firefox         # also run landing-firefox project
 *
 * npm:
 *   npm run test:all
 *   npm run test:all:update
 */
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)

const update = args.includes('--update')
const landingOnly = args.includes('--landing-only')
const portalOnly = args.includes('--portal-only')
const withFirefox = args.includes('--firefox')

const grepIdx = args.findIndex((a) => a === '-g' || a === '--grep')
const grep = grepIdx >= 0 ? args[grepIdx + 1] : null

function log(msg) {
  console.log(`[test:all] ${msg}`)
}

function runPlaywright(extraArgs) {
  const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx'
  const result = spawnSync(cmd, ['playwright', 'test', ...extraArgs], {
    cwd: here,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function withGrep(base) {
  if (!grep) return base
  return [...base, '-g', grep]
}

if (update) {
  if (!portalOnly) {
    log('Updating landing snapshots…')
    const landingArgs = withGrep(['--project=landing'])
    if (withFirefox) landingArgs.push('--project=landing-firefox')
    landingArgs.push('--update-snapshots')
    runPlaywright(landingArgs)
  }

  if (!landingOnly) {
    log('Updating portal visual snapshots…')
    // Prefer visual-only update; site -g still matches "voidborn portal visual › …"
    const visualGrep = grep ? `${grep}.*visual|visual.*${grep}` : 'visual'
    runPlaywright(['--project=portal', '-g', visualGrep, '--update-snapshots'])
  }

  log('Done.')
  process.exit(0)
}

const projects = []
if (!portalOnly) {
  projects.push('--project=landing')
  if (withFirefox) projects.push('--project=landing-firefox')
}
if (!landingOnly) {
  projects.push('--project=portal')
}

const pwArgs = withGrep(projects)
log(`Running: playwright test ${pwArgs.join(' ')}`)
runPlaywright(pwArgs)
log('Done.')
