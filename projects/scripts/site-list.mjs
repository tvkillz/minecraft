#!/usr/bin/env node
import { loadRegistry, prodPort } from '../../frontend/scripts/project-ports.mjs'

const rows = loadRegistry().map((site, index) => ({
  id: site.id,
  domain: site.domain || '',
  status: site.status || '',
  port: prodPort(site.id, index),
}))

console.log('id\tdomain\tstatus\tport')
for (const row of rows) {
  console.log(`${row.id}\t${row.domain}\t${row.status}\t${row.port}`)
}
