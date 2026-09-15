import { appConfig } from '@/config'

const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function isValidUsername(username: string): boolean {
  const { usernameMinLength, usernameMaxLength } = appConfig.auth
  const trimmed = username.trim()
  return (
    trimmed.length >= usernameMinLength &&
    trimmed.length <= usernameMaxLength &&
    USERNAME_PATTERN.test(trimmed)
  )
}

export function isValidPassword(password: string): boolean {
  const { passwordMinLength } = appConfig.auth
  if (password.length < passwordMinLength) return false
  if (!/[A-Z]/.test(password)) return false
  if (!/[^A-Za-z0-9]/.test(password)) return false
  return true
}

const MIN_PHONE_LENGTH = 8
const MIN_PHONE_DIGITS = 7

export function isValidPhone(phone: string): boolean {
  const trimmed = phone.trim()
  if (trimmed.length < MIN_PHONE_LENGTH) return false
  const digits = trimmed.replace(/\D/g, '')
  return digits.length >= MIN_PHONE_DIGITS
}
