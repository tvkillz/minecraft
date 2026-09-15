/** Elemental realm category (domain grouping for locations / cards). */
export type ElementCategory = 'earth' | 'water' | 'fire' | 'air'

export type SitemapChangeFrequency =
  | 'always'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'never'

export interface SitemapEntryConfig {
  path: string
  changeFrequency?: SitemapChangeFrequency
  priority?: number
  lastModified?: string
}

export interface SitemapConfig {
  entries: SitemapEntryConfig[]
  robots?: {
    disallow?: string[]
  }
}

export type LandingVariant =
  | 'voidborn'
  | 'iyashikei'
  | 'helix'
  | 'final_whistle'
  | 'wildreach'
  | 'minecraft'

export interface LandingConfig {
  variant: LandingVariant
  introVideo: boolean
  heroMedia: 'slides' | 'video-then-slides'
  /** Optional hero card slug order (overrides one-per-location featured cards). */
  heroCardSlugs?: string[]
}

export interface AppConfig {
  /** Registry / content pack id — scopes auth and backend data to this site. */
  siteId: string

  /**
   * Optional plus-address suffix for Supabase auth (e.g. user+komorebi@…).
   * Defaults to siteId. Backend must map suffix → siteId (see sites-auth-email-alias.sql).
   */
  authEmailSuffix?: string

  /** Brand name (display, document title, aria labels). */
  name: {
    display: string
    short: string
    documentTitle: string
  }

  /** Site URL, routes, and in-page anchors. */
  domain: {
    siteUrl: string
    routes: {
      home: string
      play: string
      leaderboard: string
      portal: string
      portalMarket: string
      portalVaults: string
      portalCollection: string
      portalTransactions: string
      portalProfile: string
      portalStore: string
      checkout: string
      checkoutSuccess: string
      checkoutCancel: string
      withdrawalSuccess: string
      tutorial: string
    }
    legal: {
      termsUrl: string
      privacyUrl: string
      refundPolicyUrl: string
    }
    anchors: {
      play: string
      market: string
      leaderboard: string
    }
  }

  /** Logo and favicon paths (favicon generated from logo at compile time). */
  logo: {
    src: string
    alt: string
    favicon: string
    /** Optional SVG favicon copied at compile time (e.g. brand/favicon.svg). */
    faviconSvg?: string
    /** Optional wide wordmark for site header (hides title text when set). */
    headerLogo?: string
    headerLogoAlt?: string
    /** Optional play lobby title image (replaces title text on /play). */
    playLogo?: string
    playLogoAlt?: string
  }

  /** Page + social metadata from projects/{id}/copy/seo.json. */
  seo: {
    title: string
    description: string
    siteName: string
    image: string
    imageAlt: string
  }

  /** Sitemap + robots rules from projects/{id}/copy/sitemap.json. */
  sitemap?: SitemapConfig

  /** Landing shell variant — drives hero, header, and page atmosphere. */
  landing: LandingConfig

  /** Palette — drives CSS custom properties via applyTheme(). */
  colors: {
    voidBlack: string
    gold: string
    purpleGlow: string
    cyanGlow: string
    ember: string
    violetAccent: string
    textPrimary: string
    textMuted: string
    accentPink: string
    accentPurple: string
    playCyan: string
    playGold: string
    triggerOrange: string
    triggerGreen: string
    triggerBlue: string
  }

  /** Static art asset paths (served from compiled public/assets/). */
  arts: {
    introVideo: string
    defaultArenaLocationId: string
    defaultLobbyLocationId: string
    cardsDir: string
    locationsDir: string
    /** Optional CDN base for production card art (Supabase Storage). */
    cdnBase?: string | null
    /** Optional dedicated /play lobby background (overrides defaultLobbyLocationId). */
    playLobbyBackground?: string
  }

  /** UI copy keyed by surface. */
  descriptions: {
    hero: {
      headline: string[]
      subheadline: string
      /** Java server address shown in the storefront hero. */
      joinIp?: string
      joinHint?: string
      copyIpLabel?: string
      copiedIpLabel?: string
      discordLabel?: string
    }
    locations: {
      kicker: string
      paragraphs: string[]
    }
    dominions: {
      title: string
      description: string
    }
    gameModel: {
      title: string
      description: string
      pillars: GameModelPillarConfig[]
      tags: GameModelTagConfig[]
    }
    collection: {
      title: string
      description: string
      backgroundImage: string
      stats: CollectionStatConfig[]
      cards: CollectionCardDisplay[]
    }
    pathways: {
      title: string
      description: string
      features: PathwaysFeatureConfig[]
      tiers: PathwaysTierConfig[]
      marketCta: PathwaysMarketCtaConfig | null
    }
    faq: {
      title: string
      items: FaqItemConfig[]
    }
    tutorial: TutorialConfig
    finalCta: {
      title: string
      subtitle: string
      description: string
      buttonLabel: string
      route: keyof AppConfig['domain']['routes']
      backgroundImage: string
      siege: {
        title: string
        stats: FinalCtaStatConfig[]
      }
    }
    footer: FooterConfig
    play: {
      screenLabel: string
      titleLine: string
      titleAccent: string
    }
    collections: string
    leaderboard: string
    portal: {
      gateTitle: string
      gateMessage: string
      comingSoon: string
      buyCredits: string
      withdraw: string
      cart: string
      currencyLabel: string
    }
    credits: {
      title: string
      subtitle: string
      standardRate: string
      popularBadge: string
      customAmount: string
      amountToBuy: string
      amountPlaceholder: string
      totalLabel: string
      buy: string
      closeLabel: string
    }
    deckModal: {
      title: string
      deckPlaceholder: string
      cancel: string
      enterBattle: string
      manageDecks: string
    }
    header: {
      signIn: string
      signOut: string
      signedInAs: string
    }
    auth: {
      signInTitle: string
      signInSubtitle: string
      registerTitle: string
      registerSubtitle: string
      emailLabel: string
      usernameLabel: string
      passwordLabel: string
      confirmPasswordLabel: string
      signInSubmit: string
      registerSubmit: string
      switchToRegister: string
      switchToSignIn: string
      forgotPasswordLink: string
      forgotPasswordTitle: string
      forgotPasswordSubtitle: string
      forgotPasswordSubmit: string
      resetEmailSent: string
      registerEmailSent?: string
      resetFailed: string
      callbackLoading: string
      callbackRecoveryTitle: string
      callbackRecoverySubtitle: string
      callbackNewPasswordLabel: string
      callbackConfirmPasswordLabel: string
      callbackUpdatePasswordSubmit: string
      callbackPasswordUpdated: string
      callbackFailed: string
      switchBackToSignIn: string
      closeLabel: string
      passwordHint: string
      playGateTitle: string
      playGateMessage: string
      playGateCta: string
      loading: string
      errors: {
        supabaseUnavailable: string
        invalidEmail: string
        invalidUsername: string
        invalidPassword: string
        passwordMismatch: string
        signInEmptyPassword: string
        signInFailed: string
        invalidCredentials: string
        /** Shown when credentials fail — hints that the account may belong to another site. */
        wrongSiteAccount?: string
        signUpFailed: string
        emailConfirmation: string
        emailNotConfirmed: string
      }
    }
  }

  /** Credit shop packages and pricing (100 credits = 1 EUR). */
  credits: {
    creditsPerEur: number
    currencySymbol: string
    packages: CreditPackageConfig[]
  }

  /** Auth UI and validation rules (Supabase). */
  auth: {
    /** When false, play is open without login (e.g. local dev without env). */
    requireSignInForPlay: boolean
    passwordMinLength: number
    usernameMinLength: number
    usernameMaxLength: number
  }

  /** Taxonomy: elemental categories linked to location ids. */
  categories: CategoryConfig[]

  /** Card rarity tiers — display labels per project (ids match DB enum). */
  rarities?: {
    tiers: RarityTierConfig[]
    labels: Record<string, string>
  }

  /** Player portal sections (tabs under /portal/*). */
  portal: {
    sections: PortalSectionConfig[]
  }

  /** Theme tokens, lore, navigation, game modes, VFX presets. */
  theme: ThemeConfig

  /** Policy pages from projects/{id}/copy/legal/*.json */
  legal: {
    terms?: LegalDocumentConfig
    privacy?: LegalDocumentConfig
    refund?: LegalDocumentConfig
    disclaimer?: LegalDocumentConfig
    cookies?: LegalDocumentConfig
  }
}

export type LegalBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'list'; ordered?: boolean; items: string[] }
  | {
      type: 'company'
      name: string
      companyNumber: string
      address: string
      email: string
    }

export interface LegalDocumentConfig {
  eyebrow?: string
  title: string
  lastUpdated?: string
  blocks: LegalBlock[]
}

export interface PortalSectionConfig {
  id: string
  label: string
  route: keyof AppConfig['domain']['routes']
  title: string
  subtitle: string
}

export interface RarityTierConfig {
  id: string
  label: string
  manaMin: number
  manaMax: number
  description?: string
}

export interface CategoryConfig {
  id: ElementCategory
  label: string
  locationIds: string[]
}

export interface DominionCitySlide {
  image: string
  name: string
  description: string
}

export interface GameModelPillarConfig {
  id: string
  title: string
  description: string
  image: string
  glowColor: string
}

export interface GameModelTagConfig {
  id: string
  label: string
}

export interface CollectionStatConfig {
  id: string
  value: string
  label: string
}

export interface PathwaysFeatureConfig {
  id: string
  title: string
  description: string
  image: string
  glowColor: string
}

export interface PathwaysTierConfig {
  id: string
  rarityLabel: string
  title: string
  description: string
  glowColor: string
}

export interface PathwaysMarketCtaConfig {
  description: string
  buttonLabel: string
  route: keyof AppConfig['domain']['routes']
}

export interface FaqItemConfig {
  id: string
  question: string
  answer: string
}

export interface FinalCtaStatConfig {
  id: string
  value: string
  label: string
}

export interface FooterLegalLinkConfig {
  id: string
  label: string
  href: string
}

export interface CookieCategoryConfig {
  id: string
  label: string
  description: string
  required?: boolean
}

export interface CookieConsentCopyConfig {
  title: string
  intro: string
  policyNote: string
  consentNote: string
  manageIntro: string
  categories: CookieCategoryConfig[]
  acceptAll: string
  rejectNonEssential: string
  managePreferences: string
  savePreferences: string
  closeLabel: string
}

export interface FooterSocialLinkConfig {
  id: string
  label: string
  href: string
  icon: string
}

export interface FooterPaymentIconConfig {
  id: string
  label: string
  icon: string
}

export interface FooterConfig {
  brand: {
    name: string
    tagline: string
  }
  legal: FooterLegalLinkConfig[]
  contact: {
    companyName: string
    companyNumber: string
    address: string
    email: string
  }
  social: FooterSocialLinkConfig[]
  payments: FooterPaymentIconConfig[]
  copyright: string
  subCopyright: string
  crafted?: string
  cookieSettingsLabel: string
  cookies: CookieConsentCopyConfig | null
}

export interface CollectionCardDisplay {
  id: string
  slug: string
  title: string
  domain: string
  rarity?: string
  stats: { mana: number; attack: number; health: number }
  keywords?: string[]
  ability?: { name: string; text: string }
  glowColor: string
  thumbUrl: string
  artUrl: string
  fanIndex: number
}

export interface LocationConfig {
  id: string
  name: string
  categoryId: ElementCategory
  categoryLabel: string
  domainId: string
  glowColor: string
  epithet: string
  short: string
  /** Primary city image — preview frame + dominions first slide. */
  image: string
  /** Decorative grey backdrop — another city from the same realm when available. */
  backgroundImage: string
  /** All city art URLs for dominions carousel. */
  images: string[]
  /** City slides with name + description (game/scenes.json + game/cities.json). */
  cities: DominionCitySlide[]
}

export interface ThemeConfig {
  fonts: {
    fantasy: string
    ui: string
    googleFontsUrl: string
  }
  locations: LocationConfig[]
  lore: {
    locations: Record<string, { epithet: string; short: string }>
    global: {
      aetherBleed: string
      nullZones: string
    }
  }
  navigation: NavLinkConfig[]
  /** Signed-in burger menu (routes + actions). */
  accountMenu: AccountMenuItemConfig[]
  heroCtas: CtaConfig[]
  playModes: PlayModeConfig[]
  player: {
    /** Shown only when no auth session / username is available. */
    fallbackName: string
    /** Placeholder opponent name in arena until matchmaking. */
    opponentName: string
    defaultCredits: number
  }
  particles: {
    colors: [string, string]
  }
}

export interface CreditPackageConfig {
  id: string
  credits: number
  priceEur: number
  popular?: boolean
}

export type AccountMenuRoute =
  | 'play'
  | 'leaderboard'
  | 'portalMarket'
  | 'portalProfile'
  | 'tutorial'

export interface TutorialStatLabelConfig {
  mana: string
  attack: string
  health: string
}

export interface TutorialStatBulletConfig {
  stat: 'mana' | 'attack' | 'health' | 'domain' | 'ability' | 'keywords'
  text: string
}

export interface TutorialKeywordItemConfig {
  term: string
  definition: string
}

export interface TutorialSectionConfig {
  id: string
  title: string
  body?: string
  bullets?: TutorialStatBulletConfig[]
  steps?: string[]
  items?: TutorialKeywordItemConfig[]
}

export interface TutorialCtaConfig {
  primaryLabel: string
  primaryRoute: keyof AppConfig['domain']['routes']
  secondaryLabel?: string
  secondaryRoute?: keyof AppConfig['domain']['routes']
  secondaryNote?: string
}

export interface TutorialConfig {
  title: string
  eyebrow?: string
  lead: string
  exampleCardSlug?: string
  statLabels: TutorialStatLabelConfig
  sections: TutorialSectionConfig[]
  cta: TutorialCtaConfig
}

export interface AccountMenuItemConfig {
  id: string
  label: string
  route?: AccountMenuRoute
  action?: 'purchaseCredits' | 'signOut'
}

export interface NavLinkConfig {
  label: string
  href: string
  route?: keyof AppConfig['domain']['routes']
  anchor?: keyof AppConfig['domain']['anchors']
}

export interface CtaConfig {
  label: string
  id: string
  route?: keyof AppConfig['domain']['routes']
  anchor?: keyof AppConfig['domain']['anchors']
  accent?: 'purple' | 'cyan' | 'ember'
}

export interface PlayModeConfig {
  id: 'casual' | 'ranked' | 'tutorial'
  title: string
  subtitle: string
  /** Visual accent — colored sigil and glow (replaces emoji icons). */
  accent: 'purple' | 'cyan' | 'ember'
  /** Short label inside the mode sigil (e.g. roman numeral). */
  mark?: string
}
