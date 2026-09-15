import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { GoogleGenAI } from '@google/genai'

const cardgenRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: path.join(cardgenRoot, '.env') })
if (!process.env.GEMINI_API_KEY?.trim()) {
  dotenv.config({ path: path.join(cardgenRoot, '../contentgen/.env') })
}

export function getGeminiApiKey() {
  const key = process.env.GEMINI_API_KEY?.trim()
  if (!key) {
    throw new Error(
      'GEMINI_API_KEY is missing. Copy cardgen/.env.example to cardgen/.env and set your key.',
    )
  }
  return key
}

export function getGeminiTextModelId() {
  return process.env.GEMINI_MODEL?.trim() || 'gemini-3.1-flash-lite'
}

export function getGeminiImageModelId() {
  return process.env.GEMINI_IMAGE_MODEL?.trim() || 'gemini-2.5-flash-image'
}

export function createGeminiTextClient() {
  return new GoogleGenerativeAI(getGeminiApiKey())
}

export function createGeminiImageClient() {
  return new GoogleGenAI({ apiKey: getGeminiApiKey() })
}

export function getGenerativeModel(schema) {
  const genAI = createGeminiTextClient()
  return genAI.getGenerativeModel({
    model: getGeminiTextModelId(),
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: schema,
    },
  })
}
