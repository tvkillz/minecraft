#!/usr/bin/env node
/**
 * Write a Minecraft store content pack under projects/{id}/.
 * Used by site-add and to seed _template / first stores.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const PROJECTS = path.join(ROOT, 'projects')

function parseArgs(argv = process.argv) {
  const out = {
    id: '',
    name: '',
    short: '',
    url: '',
  }
  for (const arg of argv.slice(2)) {
    if (arg.startsWith('--id=')) out.id = arg.slice(5)
    else if (arg.startsWith('--name=')) out.name = arg.slice(7)
    else if (arg.startsWith('--short=')) out.short = arg.slice(8)
    else if (arg.startsWith('--url=')) out.url = arg.slice(6)
  }
  if (!out.id) throw new Error('--id is required')
  out.name = out.name || out.id.toUpperCase()
  out.short = out.short || out.name
  out.url = (out.url || `https://${out.id}.example.com`).replace(/\/$/, '')
  return out
}

function hostFromUrl(url) {
  return url.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
}

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`
}

function packFiles({ id, name, short, url }) {
  const host = hostFromUrl(url)
  const email = `support@${host}`

  const files = {}

  files['manifest.json'] = json({
    id,
    siteUrl: url,
    name: {
      display: name,
      short,
      documentTitle: name,
    },
    routes: {
      home: '/',
      play: '/play',
      leaderboard: '/leaderboard',
      portal: '/portal',
      portalMarket: '/portal/market',
      portalVaults: '/portal/vaults',
      portalCollection: '/portal/collection',
      portalTransactions: '/portal/transactions',
      portalProfile: '/portal/profile',
      portalStore: '/portal/store',
      checkout: '/checkout',
      checkoutSuccess: '/portal/checkout/success',
      checkoutCancel: '/portal/checkout/cancel',
      withdrawalSuccess: '/portal/withdrawal/success',
      tutorial: '/tutorial',
    },
    legal: {
      termsUrl: '/terms',
      privacyUrl: '/privacy',
      refundPolicyUrl: '/refund-policy',
    },
    anchors: {
      play: '#ranks',
      market: '#coins',
      leaderboard: '#minigames',
    },
    brand: {
      logo: 'brand/gamelogo.png',
      logoAlt: short,
      headerLogo: 'brand/header.png',
      headerLogoAlt: short,
      playLogo: 'brand/gamelogo.png',
      playLogoAlt: short,
      playLobby: 'brand/play-lobby.png',
    },
    features: {
      requireSignInForPlay: true,
    },
    assets: {
      publicBase: '/assets',
    },
  })

  files['theme/colors.json'] = json({
    voidBlack: '#121212',
    gold: '#e8b923',
    purpleGlow: '#5aa6ff',
    cyanGlow: '#4ec8ff',
    ember: '#3d8f3d',
    violetAccent: '#6ee7a8',
    textPrimary: '#f4f4f5',
    textMuted: 'rgba(244, 244, 245, 0.82)',
    accentPink: '#7cf27c',
    accentPurple: '#3d8f3d',
    playCyan: '#7fd8ff',
    playGold: '#f3c74f',
    triggerOrange: '#fb923c',
    triggerGreen: '#22c55e',
    triggerBlue: '#3b82f6',
  })

  files['theme/landing.json'] = json({
    variant: 'voidborn',
    introVideo: false,
    heroMedia: 'slides',
    heroCardSlugs: [
      'ranks_card_01_pro',
      'ranks_card_02_ace',
      'ranks_card_03_legend',
      'coins_card_01_bag',
      'games_card_01_disasters',
      'games_card_02_minemart',
    ],
  })

  files['theme/ui.json'] = json({
    fonts: {
      fantasy: "'Cinzel', 'Times New Roman', serif",
      ui: "'Inter', system-ui, sans-serif",
      googleFontsUrl:
        'https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap',
    },
    navigation: [
      { label: 'Store', href: '/', route: 'home' },
      { label: 'Ranks', href: '/#ranks', anchor: 'play' },
      { label: 'Coins', href: '/#coins', anchor: 'market' },
      { label: 'Minigames', href: '/#minigames', anchor: 'leaderboard' },
    ],
    accountMenu: [
      { id: 'play', label: 'Join Server', route: 'play' },
      { id: 'market', label: 'Store', route: 'portalStore' },
      { id: 'profile', label: 'Profile', route: 'portalProfile' },
      { id: 'credits', label: 'Buy Coins', action: 'purchaseCredits' },
      { id: 'sign-out', label: 'Sign Out', action: 'signOut' },
    ],
    heroCtas: [
      { id: 'ranks', label: 'View Ranks', anchor: 'play', accent: 'purple' },
      { id: 'coins', label: 'Victory Coins', anchor: 'market', accent: 'cyan' },
      { id: 'store', label: 'Open Store', route: 'portalStore', accent: 'ember' },
    ],
    playModes: [
      {
        id: 'casual',
        title: 'Minigames',
        subtitle: 'Hop into Survive Disasters, MineMart, and more',
        accent: 'cyan',
        mark: 'I',
      },
      {
        id: 'ranked',
        title: 'Ranks',
        subtitle: 'Permanent cosmetic and quality-of-life perks',
        accent: 'ember',
        mark: 'II',
      },
      {
        id: 'tutorial',
        title: 'How to join',
        subtitle: 'Java 1.20.4+ — copy the IP from the hero',
        accent: 'purple',
        mark: 'III',
      },
    ],
    player: {
      fallbackName: 'Player',
      opponentName: 'Server',
      defaultCredits: 0,
    },
    particles: {
      colors: ['#3d8f3d', '#e8b923'],
    },
  })

  files['copy/descriptions.json'] = json({
    hero: {
      headline: ['A Minecraft minigames server.', 'Support the store. Unlock the perks.'],
      subheadline:
        'Ranks, Victory Coins, and unique minigames — Survive Disasters, MineMart, and more. Java 1.20.4+.',
    },
    locations: {
      kicker: 'Welcome to the official store',
      paragraphs: [
        'Running a quality Minecraft server is not cheap. Hosting, development, builds, and ongoing updates all take time and resources. Purchases here directly support the server.',
        'This server can be joined using <strong>Minecraft Java 1.20.4+</strong>. Not affiliated with Mojang, Microsoft, or Minecraft.',
      ],
    },
    play: {
      screenLabel: `${short} play screen`,
      titleLine: name,
      titleAccent: '',
    },
    collections: 'Your unlocked ranks and coin packs.',
    leaderboard: 'Server standings — coming soon.',
    portal: {
      gateTitle: 'Sign In Required',
      gateMessage: 'Sign in to buy ranks, coins, and review your store history.',
      comingSoon: 'This section is still being built.',
      buyCredits: '+ BUY',
      withdraw: 'WITHDRAW',
      cart: 'CART',
      currencyLabel: 'EUR',
    },
    credits: {
      title: 'Victory Coins',
      subtitle: 'Speed up progression — kits, extra inventory, and lobby cosmetics.',
      standardRate: 'STANDARD RATE',
      popularBadge: 'BEST DEAL',
      customAmount: 'CUSTOM AMOUNT',
      amountToBuy: 'AMOUNT TO BUY',
      amountPlaceholder: 'Enter amount...',
      totalLabel: 'TOTAL:',
      buy: 'BUY',
      closeLabel: 'Close',
    },
    deckModal: {
      title: 'Choose a loadout',
      deckPlaceholder: 'Choose a loadout...',
      cancel: 'Cancel',
      enterBattle: 'Join',
      manageDecks: 'Manage',
    },
    header: {
      signIn: 'Login',
      signOut: 'Sign Out',
      signedInAs: 'Signed in as',
    },
    auth: {
      signInTitle: 'Welcome back',
      signInSubtitle: 'Sign in with your email and password to continue.',
      registerTitle: 'Create your account',
      registerSubtitle: 'Register to buy ranks and Victory Coins.',
      emailLabel: 'Email',
      usernameLabel: 'Username',
      passwordLabel: 'Password',
      confirmPasswordLabel: 'Confirm Password',
      signInSubmit: 'Sign In',
      registerSubmit: 'Create Account',
      switchToRegister: 'New here? Register',
      switchToSignIn: 'Already have an account? Sign In',
      forgotPasswordLink: 'Forgot password?',
      forgotPasswordTitle: 'Reset password',
      forgotPasswordSubtitle: 'Enter your email and we will send a reset link.',
      forgotPasswordSubmit: 'Send Reset Link',
      resetEmailSent: 'Check your email for a password reset link.',
      resetFailed: 'Could not send reset email. Try again later.',
      callbackLoading: 'Verifying your link…',
      callbackRecoveryTitle: 'Set a New Password',
      callbackRecoverySubtitle: 'Choose a new password for your account.',
      callbackNewPasswordLabel: 'New Password',
      callbackConfirmPasswordLabel: 'Confirm New Password',
      callbackUpdatePasswordSubmit: 'Update Password',
      callbackPasswordUpdated: 'Password updated. You can sign in now.',
      callbackFailed: 'This link is invalid or expired. Request a new one.',
      switchBackToSignIn: 'Back to sign in',
      closeLabel: 'Close',
      passwordHint: 'At least 8 characters, one uppercase letter, and one symbol.',
      playGateTitle: 'Sign In Required',
      playGateMessage: 'Sign in before using the store portal.',
      playGateCta: 'Sign In',
      loading: 'Loading…',
      errors: {
        supabaseUnavailable: 'Authentication is not configured. Set Supabase env vars on the server.',
        invalidEmail: 'Enter a valid email address.',
        invalidUsername: 'Username must be 3–24 characters (letters, numbers, underscore).',
        invalidPassword: 'Password needs 8+ characters, one uppercase letter, and one symbol.',
        passwordMismatch: 'Passwords do not match.',
        signInEmptyPassword: 'Enter your password.',
        signInFailed: 'Sign in failed. Please try again.',
        invalidCredentials: 'Invalid email or password.',
        signUpFailed: 'Registration failed. Try a different email or username.',
        emailConfirmation: 'Check your email to confirm your account, then sign in.',
        emailNotConfirmed: 'Confirm your email before signing in, or use Register if you have no account.',
      },
    },
  })

  files['copy/dominions.json'] = json({
    title: 'Minigames',
    description:
      'From surviving disasters to getting trapped in an infinite store, this server is a collection of unique Minecraft experiences.',
  })

  files['copy/gamemodel.json'] = json({
    title: 'How the store works',
    description:
      'Buy ranks for cosmetics and quality-of-life perks. Buy Victory Coins to speed up kits, inventory, and lobby cosmetics. Everything supports server hosting and updates.',
    pillars: [
      {
        id: 'ranks',
        title: 'Ranks',
        description:
          'Permanent and upgradeable. Particles, chat prefixes, ranked maps, extra inventory, and Discord perks.',
        image: 'gamemodel/ranks.png',
        glowColor: '#e8b923',
      },
      {
        id: 'coins',
        title: 'Victory Coins',
        description:
          'Server currency for Survive Disasters kits, MineMart slots, and lobby cosmetics. Earn in-game or buy here.',
        image: 'gamemodel/coins.png',
        glowColor: '#c9a227',
      },
      {
        id: 'minigames',
        title: 'Minigames',
        description:
          'Survive Disasters, MineMart, and more — unique modes you will not find on a generic survival box.',
        image: 'gamemodel/minigames.png',
        glowColor: '#3d8f3d',
      },
    ],
    tags: [
      { id: 'java', label: 'Java 1.20.4+' },
      { id: 'ranks', label: 'Permanent ranks' },
      { id: 'fair', label: 'No pay-to-win combat' },
    ],
  })

  files['copy/collection.json'] = json({
    title: 'Ranks & Victory Coins',
    description:
      'Ranks offer cosmetic bonuses and quality-of-life features. Victory Coins speed up progression across every minigame.',
    backgroundImage: 'cities/games/arcade_01.png',
    stats: [
      { id: 'ranks', value: '5', label: 'Rank tiers' },
      { id: 'coins', value: '5', label: 'Coin packs' },
      { id: 'modes', value: '2+', label: 'Minigames' },
      { id: 'perks', value: '∞', label: 'More coming' },
    ],
    cardSlugs: [
      'ranks_card_01_pro',
      'ranks_card_02_ace',
      'ranks_card_03_legend',
      'coins_card_01_bag',
      'games_card_01_disasters',
      'games_card_02_minemart',
    ],
  })

  files['copy/pathways.json'] = json({
    title: 'Support the server',
    description:
      'Hosting, builds, and updates are funded by this store. Pick a rank, grab coins, or just jump in and play.',
    features: [
      {
        id: 'join-discord',
        title: 'Join Discord',
        description: 'Ranked chat, priority feedback, and patch notes.',
        image: 'cta1/join-discord.png',
        glowColor: '#5865f2',
      },
      {
        id: 'copy-ip',
        title: 'Copy the IP',
        description: 'Java 1.20.4+ — paste the address from the hero and connect.',
        image: 'cta1/copy-ip.png',
        glowColor: '#3d8f3d',
      },
      {
        id: 'buy-rank',
        title: 'Buy a rank',
        description: 'Permanent perks. Upgrade later without losing what you paid.',
        image: 'cta1/buy-rank.png',
        glowColor: '#e8b923',
      },
      {
        id: 'buy-coins',
        title: 'Buy Victory Coins',
        description: 'Kits, extra MineMart slots, and lobby cosmetics.',
        image: 'cta1/buy-coins.png',
        glowColor: '#c9a227',
      },
    ],
    tiers: [
      {
        id: 'uncommon',
        rarityLabel: 'PRO',
        title: 'Pro Rank',
        description: 'Affordable start — lobby particles, chat prefix, early inventory slot.',
        glowColor: '#5eead4',
      },
      {
        id: 'rare',
        rarityLabel: 'ACE',
        title: 'Ace Rank',
        description: 'The usual best deal — extra particles, bonus coins, more ranked maps.',
        glowColor: '#e8b923',
      },
      {
        id: 'epic',
        rarityLabel: 'LEGEND',
        title: 'Legend Rank',
        description: 'Top tier cosmetics, the most ranked maps, and the biggest coin bonus.',
        glowColor: '#f3c74f',
      },
    ],
    marketCta: {
      description: 'Ready to support the server?',
      buttonLabel: 'Open the store',
      route: 'portalStore',
    },
  })

  files['copy/faq.json'] = json({
    title: 'F.A.Q',
    items: [
      {
        id: 'how-join',
        question: 'How do I join the server?',
        answer:
          'Use Minecraft Java 1.20.4 or newer. Copy the server IP from the hero and add it in Multiplayer.',
      },
      {
        id: 'ranks-permanent',
        question: 'Are ranks permanent?',
        answer: 'Yes. Ranks are permanent and can be upgraded from this store.',
      },
      {
        id: 'pay-to-win',
        question: 'Is this pay-to-win?',
        answer:
          'Ranks are cosmetics and quality-of-life. Ranked maps can still roll for everyone when a ranked player is in the game.',
      },
      {
        id: 'coins',
        question: 'What are Victory Coins?',
        answer:
          'The shared currency for kits, extra inventory, and lobby cosmetics. Earn them by playing or buy packs here.',
      },
    ],
  })

  files['copy/tutorial.json'] = json({
    title: 'How to play',
    eyebrow: 'Getting started',
    lead: 'Copy the IP, join Discord, then pick a rank or coin pack if you want to support the server.',
    exampleCardSlug: 'ranks_card_02_ace',
    statLabels: { mana: 'Price', attack: 'Perks', health: 'Tier' },
    sections: [
      {
        id: 'join',
        title: 'Join the server',
        body: 'Java 1.20.4+. Paste the IP from the hero into Multiplayer.',
        bullets: [],
        steps: ['Copy the IP', 'Add the server in Minecraft', 'Join the lobby'],
        items: [],
      },
    ],
    cta: {
      primaryLabel: 'Open store',
      primaryRoute: 'portalStore',
      secondaryLabel: 'Home',
      secondaryRoute: 'home',
      secondaryNote: '',
    },
  })

  files['copy/finalcta.json'] = json({
    title: 'See you on the server',
    subtitle: short,
    description: 'Copy the IP, grab a rank if you like, and jump into a minigame.',
    buttonLabel: 'View ranks',
    route: 'home',
    backgroundImage: 'cities/lobby/spawn_01.png',
    siege: {
      title: 'Store highlights',
      stats: [
        { id: 'ranks', value: '5', label: 'Ranks' },
        { id: 'coins', value: '5', label: 'Coin packs' },
        { id: 'modes', value: '2+', label: 'Minigames' },
      ],
    },
  })

  files['copy/footer.json'] = json({
    brand: {
      name: short,
      tagline: 'Official Minecraft minigames store',
    },
    legal: [
      { id: 'terms', label: 'Terms', href: '/terms' },
      { id: 'privacy', label: 'Privacy', href: '/privacy' },
      { id: 'refund', label: 'Refunds', href: '/refund-policy' },
      { id: 'cookies', label: 'Cookies', href: '/cookie-policy' },
    ],
    contact: {
      companyName: short,
      companyNumber: '',
      address: '',
      email,
    },
    social: [
      {
        id: 'discord',
        label: 'Discord',
        href: '#',
        icon: 'shared/discord.svg',
      },
    ],
    payments: [
      { id: 'visa', label: 'Visa', icon: 'shared/visa.svg' },
      { id: 'mastercard', label: 'Mastercard', icon: 'shared/mastercard.svg' },
    ],
    copyright: `© ${new Date().getFullYear()} ${short}. All rights reserved.`,
    subCopyright: 'Not affiliated with Mojang, Microsoft, or Minecraft.',
    crafted: '',
    cookieSettingsLabel: 'Cookie Settings',
    cookies: {
      title: 'Cookies',
      intro: 'We use cookies to keep you signed in and understand store traffic.',
      policyNote: 'See the cookie policy for details.',
      consentNote: 'You can change this later.',
      manageIntro: 'Choose which cookies to allow.',
      categories: [
        {
          id: 'necessary',
          label: 'Necessary',
          description: 'Required for login and checkout.',
          required: true,
        },
        {
          id: 'analytics',
          label: 'Analytics',
          description: 'Helps us see which store pages are useful.',
        },
      ],
      acceptAll: 'Accept All',
      rejectNonEssential: 'Reject Non-Essential',
      managePreferences: 'Manage Preferences',
      savePreferences: 'Save Preferences',
      closeLabel: 'Close',
    },
  })

  files['copy/seo.json'] = json({
    title: `${name} — Official Minecraft store`,
    description: `Buy ranks and Victory Coins for ${short}. Minecraft Java minigames server.`,
    siteName: name,
    imageAlt: `${short} store logo`,
    image: 'brand/gamelogo.png',
  })

  files['copy/sitemap.json'] = json({
    entries: [
      { path: '/', changeFrequency: 'weekly', priority: 1 },
      { path: '/play', changeFrequency: 'weekly', priority: 0.5 },
      { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
      { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
      { path: '/refund-policy', changeFrequency: 'yearly', priority: 0.3 },
      { path: '/disclaimer', changeFrequency: 'yearly', priority: 0.3 },
      { path: '/cookie-policy', changeFrequency: 'yearly', priority: 0.3 },
    ],
    robots: {
      disallow: ['/portal/', '/checkout', '/auth/', '/profile', '/market'],
    },
  })

  const legalDoc = (title, text) => ({
    title,
    lastUpdated: '2026-09-15',
    blocks: [
      { type: 'paragraph', text },
      { type: 'company', name: short, companyNumber: '', address: '', email },
    ],
  })

  files['copy/legal/terms.json'] = json(
    legalDoc(
      'Terms of Service',
      `Purchases on ${url} are digital store features (ranks, coins, cosmetics). They support server hosting and development. Not affiliated with Mojang, Microsoft, or Minecraft.`,
    ),
  )
  files['copy/legal/privacy.json'] = json(
    legalDoc(
      'Privacy Notice',
      `${short} stores the account data needed for login, orders, and support. Contact ${email} for requests.`,
    ),
  )
  files['copy/legal/refund.json'] = json(
    legalDoc(
      'Refund Policy',
      'Digital ranks and coin packs are fulfilled immediately and are generally non-refundable except where required by law.',
    ),
  )
  files['copy/legal/disclaimer.json'] = json(
    legalDoc(
      'Disclaimer',
      `${short} is not affiliated with Mojang, Microsoft, or Minecraft.`,
    ),
  )
  files['copy/legal/cookies.json'] = json(
    legalDoc(
      'Cookie Policy',
      'Necessary cookies keep you signed in. Optional analytics cookies can be rejected.',
    ),
  )

  files['portal/sections.json'] = json({
    sections: [
      {
        id: 'market',
        label: 'Store',
        route: 'portalMarket',
        title: 'STORE',
        subtitle: 'Browse ranks and Victory Coin packs.',
      },
      {
        id: 'collection',
        label: 'Unlocks',
        route: 'portalCollection',
        title: 'UNLOCKS',
        subtitle: 'Ranks and packs tied to your account.',
      },
      {
        id: 'transactions',
        label: 'Transactions',
        route: 'portalTransactions',
        title: 'TRANSACTIONS',
        subtitle: 'Order and credit history.',
      },
      {
        id: 'profile',
        label: 'Profile',
        route: 'portalProfile',
        title: 'PROFILE',
        subtitle: 'Account settings.',
      },
    ],
  })

  files['credits.json'] = json({
    creditsPerEur: 100,
    currencySymbol: '€',
    packages: [
      { id: 'coins-100', credits: 100, priceEur: 1 },
      { id: 'coins-500', credits: 500, priceEur: 4 },
      { id: 'coins-1000', credits: 1000, priceEur: 7, popular: true },
      { id: 'coins-5000', credits: 5000, priceEur: 30 },
      { id: 'coins-10000', credits: 10000, priceEur: 55 },
    ],
  })

  files['auth.json'] = json({
    requireSignInForPlay: true,
    passwordMinLength: 8,
    usernameMinLength: 3,
    usernameMaxLength: 24,
  })

  files['game/domains.json'] = json({
    domains: [
      { id: 'lobby', label: 'Lobby', categoryId: 'earth', glowColor: '#3d8f3d' },
      { id: 'ranks', label: 'Ranks', categoryId: 'fire', glowColor: '#e8b923' },
      { id: 'coins', label: 'Victory Coins', categoryId: 'water', glowColor: '#c9a227' },
      { id: 'games', label: 'Minigames', categoryId: 'air', glowColor: '#5aa6ff' },
    ],
  })

  files['game/categories.json'] = json({
    categories: [
      { id: 'earth', label: 'Lobby', locationIds: ['lobby'] },
      { id: 'fire', label: 'Ranks', locationIds: ['ranks'] },
      { id: 'water', label: 'Coins', locationIds: ['vault'] },
      { id: 'air', label: 'Minigames', locationIds: ['arcade'] },
    ],
  })

  files['game/locations.json'] = json({
    defaults: {
      arenaLocationId: 'arcade',
      lobbyLocationId: 'lobby',
    },
    lore: {
      global: {
        aetherBleed: 'Server upkeep',
        nullZones: 'Maintenance',
      },
    },
    locations: [
      {
        id: 'lobby',
        name: 'Spawn Lobby',
        domainId: 'lobby',
        categoryId: 'earth',
        glowColor: '#3d8f3d',
        epithet: 'The hub',
        short: 'Copy the IP, join Discord, and pick a minigame.',
        imageAsset: 'domains/lobby_domain.png',
        featuredCardSlug: 'ranks_card_02_ace',
      },
      {
        id: 'ranks',
        name: 'Ranks',
        domainId: 'ranks',
        categoryId: 'fire',
        glowColor: '#e8b923',
        epithet: 'Permanent perks',
        short: 'Pro through Legend — cosmetics, maps, and Discord perks.',
        imageAsset: 'domains/ranks_domain.png',
        featuredCardSlug: 'ranks_card_01_pro',
      },
      {
        id: 'vault',
        name: 'Victory Coins',
        domainId: 'coins',
        categoryId: 'water',
        glowColor: '#c9a227',
        epithet: 'Server currency',
        short: 'Buy kits, extra inventory, and lobby cosmetics.',
        imageAsset: 'domains/coins_domain.png',
        featuredCardSlug: 'coins_card_01_bag',
      },
      {
        id: 'arcade',
        name: 'Minigames',
        domainId: 'games',
        categoryId: 'air',
        glowColor: '#5aa6ff',
        epithet: 'Unique modes',
        short: 'Survive Disasters, MineMart, and more.',
        imageAsset: 'domains/games_domain.png',
        featuredCardSlug: 'games_card_01_disasters',
      },
    ],
  })

  files['game/scenes.json'] = json({
    assets: [
      {
        kind: 'domain',
        domain: 'lobby',
        slug: 'lobby_domain',
        title: 'Spawn lobby',
        path: 'domains/lobby_domain.png',
        notes: 'Minecraft Java lobby plaza, warm lanterns, NPC statues, no text.',
      },
      {
        kind: 'domain',
        domain: 'ranks',
        slug: 'ranks_domain',
        title: 'Ranks hall',
        path: 'domains/ranks_domain.png',
        notes: 'Minecraft throne hall with rank banners, gold trim, no text.',
      },
      {
        kind: 'domain',
        domain: 'coins',
        slug: 'coins_domain',
        title: 'Coin vault',
        path: 'domains/coins_domain.png',
        notes: 'Minecraft treasure vault with coin piles and chests, no text.',
      },
      {
        kind: 'domain',
        domain: 'games',
        slug: 'games_domain',
        title: 'Minigame arcade',
        path: 'domains/games_domain.png',
        notes: 'Minecraft arcade of minigame portals, bright blocky lighting, no text.',
      },
      {
        kind: 'city',
        domain: 'lobby',
        slug: 'spawn_01',
        title: 'Spawn',
        path: 'cities/lobby/spawn_01.png',
        notes: 'Wide Minecraft spawn plaza at golden hour, no text.',
      },
      {
        kind: 'city',
        domain: 'ranks',
        slug: 'hall_01',
        title: 'Rank hall',
        path: 'cities/ranks/hall_01.png',
        notes: 'Interior Minecraft rank hall, no text.',
      },
      {
        kind: 'city',
        domain: 'coins',
        slug: 'vault_01',
        title: 'Vault',
        path: 'cities/coins/vault_01.png',
        notes: 'Minecraft gold vault, no text.',
      },
      {
        kind: 'city',
        domain: 'games',
        slug: 'arcade_01',
        title: 'Arcade',
        path: 'cities/games/arcade_01.png',
        notes: 'Minecraft minigame lobby with disaster arena in the distance, no text.',
      },
    ],
  })

  files['game/cities.json'] = json({
    cities: [
      { slug: 'spawn_01', path: 'cities/lobby/spawn_01.png', name: 'Spawn', description: 'The hub.' },
      { slug: 'hall_01', path: 'cities/ranks/hall_01.png', name: 'Rank Hall', description: 'Perk gallery.' },
      { slug: 'vault_01', path: 'cities/coins/vault_01.png', name: 'Coin Vault', description: 'Victory Coins.' },
      { slug: 'arcade_01', path: 'cities/games/arcade_01.png', name: 'Arcade', description: 'Minigames.' },
    ],
  })

  files['game/keywords.json'] = json({
    keywords_glossary: {
      Rank: 'Permanent store rank with cosmetics and quality-of-life perks.',
      Coins: 'Victory Coins — shared minigame currency.',
      Kit: 'Survive Disasters loadout bought with coins.',
    },
  })

  files['game/rarities.json'] = json({
    tiers: [
      { id: 'common', label: 'Pro', manaMin: 1, manaMax: 2, description: 'Entry rank' },
      { id: 'uncommon', label: 'Ace', manaMin: 3, manaMax: 4, description: 'Best deal' },
      { id: 'rare', label: 'King / Queen', manaMin: 5, manaMax: 6, description: 'Mid-high rank' },
      { id: 'epic', label: 'Legend', manaMin: 7, manaMax: 10, description: 'Top rank' },
    ],
  })

  const feature = (slug, title, domain, rarity, mana, role, abilityName, abilityText, prompt) => ({
    slug,
    title,
    domain,
    role,
    rarity,
    path: `cards/${domain}/${slug}.png`,
    stats: { mana, attack: mana, health: mana + 1 },
    keywords: domain === 'ranks' ? ['Rank'] : domain === 'coins' ? ['Coins'] : ['Kit'],
    ability: { name: abilityName, text: abilityText },
    image_prompt: prompt,
  })

  files['game/cards.json'] = json({
    cards: [
      feature(
        'ranks_card_01_pro',
        'Pro Rank',
        'ranks',
        'common',
        2,
        'Rank',
        'Starter perks',
        'Lobby particle ×1, [Pro] chat prefix, early 5th MineMart slot.',
        'Minecraft item icon of a green rank badge, blocky, no text.',
      ),
      feature(
        'ranks_card_02_ace',
        'Ace Rank',
        'ranks',
        'uncommon',
        4,
        'Rank',
        'Best deal',
        'Two lobby particles, [Ace] prefix, 100 bonus Victory Coins, extra ranked maps.',
        'Minecraft item icon of a gold ace rank badge, blocky, no text.',
      ),
      feature(
        'ranks_card_03_legend',
        'Legend Rank',
        'ranks',
        'epic',
        8,
        'Rank',
        'Top tier',
        'Three particles, [Legend] prefix, 1000 bonus coins, most ranked maps.',
        'Minecraft item icon of an orange legend crown, blocky, no text.',
      ),
      feature(
        'coins_card_01_bag',
        'Victory Coins',
        'coins',
        'uncommon',
        3,
        'Currency pack',
        'Server currency',
        'Spend on kits, extra inventory, and lobby cosmetics. Also earned by playing.',
        'Minecraft painting of a brown coin pouch with a V mark, blocky, no readable text.',
      ),
      feature(
        'games_card_01_disasters',
        'Survive Disasters',
        'games',
        'rare',
        5,
        'Minigame',
        'Disaster rounds',
        'Survive shifting hazards. Ranked maps can appear when a ranked player is in the game.',
        'Minecraft scene of players running from a meteor, blocky, no text.',
      ),
      feature(
        'games_card_02_minemart',
        'MineMart',
        'games',
        'rare',
        5,
        'Minigame',
        'Infinite store',
        'Shop-crawl minigame. Ranks unlock the 5th inventory slot early.',
        'Minecraft infinite supermarket interior, blocky, no text.',
      ),
    ],
  })

  files['cardgen.json'] = json({
    gameTitle: short,
    gamePitch: 'a Minecraft Java minigames server store selling ranks, coin packs, and mode tiles',
    world: {
      title: short,
      description: 'Blocky minigame worlds, rank halls, and coin vaults. No photoreal people, no readable text.',
    },
    domains: {
      lobby: { visualIdentity: 'friendly Minecraft spawn plaza', flavorNotes: 'lanterns, oak, NPC statues' },
      ranks: { visualIdentity: 'ceremonial rank hall', flavorNotes: 'banners, gold trim' },
      coins: { visualIdentity: 'treasure vault', flavorNotes: 'chests, coin piles' },
      games: { visualIdentity: 'minigame arcade', flavorNotes: 'portals, disaster arena' },
    },
    image: {
      aspectRatio: '1:1',
      promptGuidelines:
        'Minecraft item or scene icon for a store tile, blocky voxel art, single focal subject, no text, no UI frame',
      promptSuffix: 'Minecraft Java voxel art, no text, no watermark, square 1:1.',
    },
  })

  files['contentgen.json'] = json({
    projectTitle: short,
    visualPitch: 'Minecraft Java minigames server store — blocky worlds, ranks, coin pouches, no UI text',
    style: {
      aesthetic:
        'Minecraft Java Edition screenshot aesthetic, voxel blocks, warm sunlight, no photoreal humans, no readable text, no logos, no watermarks',
      avoid: 'text, watermarks, logos, photoreal skin, gun violence, Mojang official logo',
      palette: 'grass green, gold, oak, night plaza lanterns',
    },
    image: {
      promptPrefix: 'Wide cinematic Minecraft Java world,',
      promptSuffix: 'blocky voxel art, no people close-up, no text, no watermark.',
      ctaSuffix:
        'Minecraft feature tile illustration, 16:9, atmospheric, no text, no watermark.',
      gamemodelSuffix:
        'square Minecraft icon illustration, centered, no text, no watermark, 1:1.',
      cardTypeSuffix:
        'square Minecraft rank emblem, centered, clean silhouette, no text, no watermark, 1:1.',
    },
    domains: {
      lobby: { mood: 'friendly spawn plaza', palette: 'grass, oak, lantern gold' },
      ranks: { mood: 'ceremonial hall', palette: 'gold, purple wool, oak' },
      coins: { mood: 'treasure vault', palette: 'gold, chest brown' },
      games: { mood: 'arcade of portals', palette: 'cyan wool, redstone lamps' },
    },
    cardTypes: {
      uncommon: { label: 'Pro / Ace', accent: '#5eead4' },
      rare: { label: 'King / Queen', accent: '#e8b923' },
      epic: { label: 'Legend', accent: '#f97316' },
    },
  })

  files['README.md'] = `# ${short}

Minecraft minigames **store** content pack for the constructor at \`~/Desktop/projects/minecraft\`.

- Site id: \`${id}\`
- URL: ${url}
- Catalog: ranks, Victory Coins, minigames (compiled through \`game/cards.json\`)

## Compile

\`\`\`bash
cd frontend
PROJECT=${id} npm run compile
PROJECT=${id} npm run dev:host
\`\`\`
`

  return files
}

export async function writeStorePack(opts) {
  const files = packFiles(opts)
  const root = path.join(PROJECTS, opts.id)
  for (const [rel, contents] of Object.entries(files)) {
    const dest = path.join(root, rel)
    await mkdir(path.dirname(dest), { recursive: true })
    await writeFile(dest, contents)
  }
  return { root, count: Object.keys(files).length }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const opts = parseArgs()
  const result = await writeStorePack(opts)
  console.log(`Wrote ${result.count} files → ${result.root}`)
}
