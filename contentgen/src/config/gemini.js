import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import { GoogleGenAI } from '@google/genai'

const contentgenRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: path.join(contentgenRoot, '.env') })

export function getGeminiApiKey() {
  const key = process.env.GEMINI_API_KEY?.trim()
  if (!key) {
    throw new Error(
      'GEMINI_API_KEY is missing. Copy contentgen/.env.example to contentgen/.env and set your key.',
    )
  }
  return key
}

export function getGeminiImageModelId() {
  return process.env.GEMINI_IMAGE_MODEL?.trim() || 'gemini-3.1-flash-image'
}

export function createGeminiImageClient() {
  return new GoogleGenAI({ apiKey: getGeminiApiKey() })
}
