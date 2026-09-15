/**
 * pm2 from frontend/:
 *   pm2 start ecosystem.config.cjs --only voidborn-dev,project2-dev
 *   pm2 start ecosystem.config.cjs --only voidborn-prod,project2-prod
 *
 * Ports auto-assign from registry order: 3100+N (N = index). Dev and prod share the same port.
 */
const path = require('node:path')
const { createRequire } = require('node:module')

const frontendRoot = __dirname
const requireFromFrontend = createRequire(__filename)
const { loadRegistry, prodPort } =
  requireFromFrontend('./scripts/project-ports.mjs')

const registry = loadRegistry()

const siteAuthEnv = {
  SITE_AUTH_USERNAME: process.env.SITE_AUTH_USERNAME || 'dev',
  SITE_AUTH_PASSWORD: process.env.SITE_AUTH_PASSWORD || 'dev',
}

function siteApps(site, index) {
  const project = site.id

  return [
    {
      name: `${project}-dev`,
      cwd: frontendRoot,
      script: 'npm',
      args: 'run dev:host',
      env: {
        NODE_ENV: 'development',
        PROJECT: project,
        PORT: String(prodPort(project, index)),
        HOSTNAME: '0.0.0.0',
        ...siteAuthEnv,
      },
    },
    {
      name: `${project}-prod`,
      cwd: frontendRoot,
      script: 'npm',
      args: 'run start:prod',
      env: {
        NODE_ENV: 'production',
        PROJECT: project,
        PORT: String(prodPort(project, index)),
        HOSTNAME: '0.0.0.0',
        SITE_HYBRID: '1',
        NEXT_PUBLIC_SITE_HYBRID: '1',
        SITE_AUTH_DISABLED: '1',
        ...siteAuthEnv,
      },
    },
  ]
}

module.exports = {
  apps: registry.flatMap(siteApps),
}
