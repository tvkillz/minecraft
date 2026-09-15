'use client'

import { useState } from 'react'
import { appConfig } from '@/config'

export default function MinecraftHeroBar() {
  const { hero } = appConfig.descriptions
  const joinIp = hero.joinIp
  const discord = appConfig.descriptions.footer?.social?.find((item) => item.id === 'discord')
  const [copied, setCopied] = useState(false)

  const copyIp = async () => {
    if (!joinIp) return
    try {
      await navigator.clipboard.writeText(joinIp)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="mc-hero__bar">
      {joinIp ? (
        <button type="button" className="mc-hero__chip mc-hero__chip--ip" onClick={() => void copyIp()}>
          <span className="mc-hero__chip-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
              <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.7" />
              <path
                d="M5.5 19c.8-3.2 3.2-5 6.5-5s5.7 1.8 6.5 5"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span className="mc-hero__chip-copy">
            <strong className="mc-hero__chip-title">{joinIp}</strong>
            <span className="mc-hero__chip-hint">
              {copied ? (hero.copiedIpLabel ?? 'Copied!') : (hero.copyIpLabel ?? 'Click to copy')}
            </span>
          </span>
        </button>
      ) : (
        <span />
      )}

      {appConfig.logo.src ? (
        <img
          className="mc-hero__brand-mark"
          src={appConfig.logo.src}
          alt={appConfig.logo.alt ?? appConfig.name.display}
        />
      ) : (
        <p className="mc-hero__brand">{appConfig.name.display}</p>
      )}

      {discord?.href ? (
        <a className="mc-hero__chip mc-hero__chip--discord" href={discord.href}>
          <span className="mc-hero__chip-copy">
            <strong className="mc-hero__chip-title">{hero.discordLabel ?? discord.label}</strong>
            <span className="mc-hero__chip-hint">Click to join</span>
          </span>
          <span className="mc-hero__chip-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
              <path
                d="M18.8943 4.34399C17.5183 3.71467 16.057 3.256 14.5317 3C14.3396 3.33067 14.1263 3.77866 13.977 4.13067C12.3546 3.89599 10.7439 3.89599 9.14391 4.13067C8.99457 3.77866 8.77056 3.33067 8.58922 3C7.05325 3.256 5.59191 3.71467 4.22552 4.34399C1.46286 8.41865 0.716188 12.3973 1.08952 16.3226C2.92418 17.6559 4.69486 18.4666 6.4346 19C6.86126 18.424 7.24527 17.8053 7.57594 17.1546C6.9466 16.92 6.34927 16.632 5.77327 16.2906C5.9226 16.184 6.07194 16.0667 6.21061 15.9493C9.68793 17.5387 13.4543 17.5387 16.889 15.9493C17.0383 16.0667 17.177 16.184 17.3263 16.2906C16.7503 16.632 16.153 16.92 15.5236 17.1546C15.8543 17.8053 16.2383 18.424 16.665 19C18.4036 18.4666 20.185 17.6559 22.01 16.3226C22.4687 11.7787 21.2836 7.83202 18.8943 4.34399ZM8.05593 13.9013C7.01058 13.9013 6.15725 12.952 6.15725 11.7893C6.15725 10.6267 6.98925 9.67731 8.05593 9.67731C9.11191 9.67731 9.97588 10.6267 9.95454 11.7893C9.95454 12.952 9.11191 13.9013 8.05593 13.9013ZM15.065 13.9013C14.0196 13.9013 13.1652 12.952 13.1652 11.7893C13.1652 10.6267 13.9983 9.67731 15.065 9.67731C16.121 9.67731 16.985 10.6267 16.9636 11.7893C16.9636 12.952 16.1317 13.9013 15.065 13.9013Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </a>
      ) : (
        <span />
      )}
    </div>
  )
}
