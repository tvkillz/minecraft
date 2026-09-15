import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const socgenRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
dotenv.config({ path: path.join(socgenRoot, '.env') })

import { runAddPost } from './commands/add-post.js'
import { runValidate, runApprove } from './commands/validate.js'
import { runGenerateImages } from './commands/generate-images.js'
import { runPublish } from './commands/publish.js'
import { runList } from './commands/list.js'
import { runExport } from './commands/export.js'
import { runWelcomeBatch } from './commands/welcome-batch.js'
import { runRealmMarketBatch } from './commands/realm-market-batch.js'
import { runFullCampaignBatch, runTestCard } from './commands/full-campaign-batch.js'
import { runContentPlan } from './commands/content-plan.js'

const [command, ...rest] = process.argv.slice(2)

const commands = {
  'add-post': runAddPost,
  validate: runValidate,
  approve: runApprove,
  'generate-images': runGenerateImages,
  publish: runPublish,
  list: runList,
  export: runExport,
  'welcome-batch': runWelcomeBatch,
  'realm-market-batch': runRealmMarketBatch,
  'full-campaign': runFullCampaignBatch,
  'test-card': runTestCard,
  'content-plan': runContentPlan,
}

if (!command || command === '--help' || command === '-h') {
  console.log(`
socgen — local social post generator (Instagram, Facebook, Discord)

Layout:
  projects/{project}/social/
    _staging/postN/     WIP — post.json, meta.json, image.png
    posts/{slug}/       published content
    card-log.json       approved card history (for random pick)

Workflow:
  add-post          Gemini copy → _staging/postN/
  validate          Lint platform rules
  approve           Ready for art + card-log entry
  generate-images   Square image (composite | gemini | auto)
  publish           Move _staging/postN → posts/
  export            Paste-ready post.txt files
  welcome-batch     Generate 5 welcome posts (AI art + logo + city refs)
  realm-market-batch  2 posts per domain + 5 market posts
  full-campaign       5 welcome + 8 domain + 5 market + 12 cards
  test-card           One card composite post for image review

Examples:
  npm run add-post -- --random-card
  npm run add-post -- --random-card --domain=kronos
  npm run add-post -- --brief="Welcome post" --template=welcome
  npm run add-post -- --card=kronos_card_01_granite_warden --brief="..."
  npm run validate && npm run approve
  npm run generate-images -- --post=post1
  npm run generate-images -- --post=post2 --force
  npm run publish -- --post=post1
  npm run export -- --published
  npm run welcome-batch
  npm run welcome-batch -- --count=3 --skip-images
  npm run realm-market-batch
  npm run realm-market-batch -- --skip-images
  npm run test-card
  npm run full-campaign -- --clean
  npm run full-campaign -- --clean --cards=0

Card posts: composite image with random realm city bg, VOIDBORN logo, full card art, Cinzel title.
Random card skips slugs in card-log.json and other _staging card posts.

Env: socgen/.env (GEMINI_API_KEY, GEMINI_MODEL, GEMINI_IMAGE_MODEL, SOCGEN_PROJECT)
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
