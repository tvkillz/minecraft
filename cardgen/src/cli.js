import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const cardgenRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: path.join(cardgenRoot, '.env') })

import { runGenerate, runGenerateDomains } from './commands/generate.js'
import { runGenerateShowcase } from './commands/generate-showcase.js'
import { runGenerateImagesShowcase } from './commands/generate-images-showcase.js'
import {
  runGenerateRound,
  runValidateRound,
  runApproveRound,
  runGenerateImagesRound,
  runApplyRound,
  runListRounds,
} from './commands/round.js'
import { runValidate } from './commands/validate.js'
import { runApprove } from './commands/approve.js'
import { runList } from './commands/list.js'
import { runImageManifest } from './commands/image-manifest.js'
import { runGenerateImages } from './commands/generate-images.js'
import { runApply } from './commands/apply.js'
import { runCleanupStaging } from './commands/cleanup-staging.js'

const [command, ...rest] = process.argv.slice(2)

const commands = {
  'generate-showcase': runGenerateShowcase,
  'generate-images-showcase': runGenerateImagesShowcase,
  generate: runGenerate,
  'generate-round': runGenerateRound,
  'generate-domains': runGenerateDomains,
  'validate-round': runValidateRound,
  'approve-round': runApproveRound,
  'generate-images-round': runGenerateImagesRound,
  'apply-round': runApplyRound,
  'list-rounds': runListRounds,
  'cleanup-staging': runCleanupStaging,
  'generate-images': runGenerateImages,
  validate: runValidate,
  approve: runApprove,
  list: runList,
  'image-manifest': runImageManifest,
  apply: runApply,
}

if (!command || command === '--help' || command === '-h') {
  console.log(`
cardgen — local Gemini card pipeline (project-scoped)

Project config: projects/{project}/cardgen.json
Staging rounds: projects/{project}/game/_staging/rounds/

Round workflow (balanced — total must divide by domain count):
  generate-round     N cards per domain (--per-domain=13 or --total=52)
  validate-round     Lint all batches in a round
  approve-round      Mark round approved
  generate-images-round
  apply-round        Merge into cards.json + assets

Single-domain / legacy:
  generate, validate, approve, generate-images, apply

Landing showcase (hero + collection — 12 slugs from locations.json + collection.json):

  generate-showcase       Gemini text for exact landing slugs
  generate-images-showcase  Art for showcase slugs already in cards.json

Examples:
  npm run generate-showcase -- --project=iyashikei
  npm run generate-images-showcase -- --project=iyashikei
  npm run generate-round -- --project=voidborn --per-domain=13
  npm run generate-round -- --project=voidborn --total=48
  npm run validate-round -- --round=round_20260625_08-20
  npm run approve-round -- --round=round_20260625_08-20
  npm run generate-images-round -- --round=round_20260625_08-20
  npm run apply-round -- --round=round_20260625_08-20
  npm run list -- --project=voidborn

Env: cardgen/.env (GEMINI_API_KEY, GEMINI_MODEL, GEMINI_IMAGE_MODEL, CARDGEN_PROJECT)
`)
  process.exit(command ? 0 : 1)
}

const handler = commands[command]
if (!handler) {
  console.error(`Unknown command: ${command}`)
  process.exit(1)
}

handler(rest).catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
