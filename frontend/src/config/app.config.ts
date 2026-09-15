import type { AppConfig } from './schema'
import bundle from '@project/bundle'

/** Compiled from projects/{PROJECT}/ via `npm run compile`. */
export const appConfig = bundle as unknown as AppConfig
