import type { BotConfiguration } from "../../types"

export interface ThemeConfig {
  // Colors
  primary: string
  primaryHover?: string
  primaryForeground?: string
  secondary?: string
  secondaryHover?: string
  secondaryForeground?: string
  background?: string
  foreground?: string
  card?: string
  cardForeground?: string
  border?: string
  input?: string
  inputBorder?: string
  ring?: string
  muted?: string
  mutedForeground?: string
  accent?: string
  accentHover?: string
  accentForeground?: string
  destructive?: string
  destructiveHover?: string
  destructiveForeground?: string
  success?: string
  successForeground?: string
  warning?: string
  warningForeground?: string
  info?: string
  infoForeground?: string

  // Border Radius
  radius?: {
    sm?: string
    md?: string
    lg?: string
    xl?: string
    xxl?: string
    full?: string
  }

  // Typography
  typography?: {
    fontFamily?: string
    fontSize?: {
      xs?: string
      sm?: string
      base?: string
      lg?: string
      xl?: string
    }
  }

  // Shadows
  shadows?: {
    sm?: string
    md?: string
    lg?: string
    xl?: string
    xxl?: string
  }

  // Layout
  layout?: {
    width?: string
    height?: string
    containerPadding?: string
    messagePadding?: string
  }
}

export const DEFAULT_THEME: ThemeConfig = {
  primary: "#3b82f6",
  primaryHover: "#2563eb",
  primaryForeground: "#ffffff",
  secondary: "#10b981",
  secondaryHover: "#059669",
  secondaryForeground: "#ffffff",
  background: "#ffffff",
  foreground: "#111827",
  card: "#f9fafb",
  cardForeground: "#111827",
  border: "#e5e7eb",
  input: "#ffffff",
  inputBorder: "#d1d5db",
  ring: "#3b82f6",
  muted: "#f3f4f6",
  mutedForeground: "#6b7280",
  accent: "#8b5cf6",
  accentHover: "#7c3aed",
  accentForeground: "#ffffff",
  destructive: "#ef4444",
  destructiveHover: "#dc2626",
  destructiveForeground: "#ffffff",
  success: "#10b981",
  successForeground: "#ffffff",
  warning: "#f59e0b",
  warningForeground: "#ffffff",
  info: "#3b82f6",
  infoForeground: "#ffffff",

  radius: {
    sm: "0.375rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
    xxl: "1.5rem",
    full: "9999px"
  },

  typography: {
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, Arial",
    fontSize: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem"
    }
  },

  shadows: {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
    xxl: "0 25px 50px -12px rgb(0 0 0 / 0.25)"
  }
}

// Widget size presets
export const WIDGET_SIZES = {
  small: { width: "20rem", height: "31.25rem" },   // 320px x 500px
  medium: { width: "23.75rem", height: "37.5rem" }, // 380px x 600px
  large: { width: "28.125rem", height: "43.75rem" } // 450px x 700px
} as const

export type WidgetSize = keyof typeof WIDGET_SIZES

function darken(color: string, percent = 10): string {
  // Use CSS color-mix for modern browser support and handling all color formats (hex, rgb, oklch, etc.)
  return `color-mix(in srgb, ${color}, black ${percent}%)`
}

export function applyThemeToElement(element: HTMLElement | null, theme: Partial<ThemeConfig>): void {
  if (!element) {
    console.warn("⚠️  Cannot apply theme: element is null")
    return
  }

  const t = { ...DEFAULT_THEME, ...theme }

  // Colors
  element.style.setProperty("--color-primary", t.primary)
  element.style.setProperty("--color-primary-hover", t.primaryHover || darken(t.primary))
  element.style.setProperty("--color-primary-foreground", t.primaryForeground!)

  if (t.secondary) element.style.setProperty("--color-secondary", t.secondary)
  if (t.secondaryHover) element.style.setProperty("--color-secondary-hover", t.secondaryHover)
  if (t.secondaryForeground) element.style.setProperty("--color-secondary-foreground", t.secondaryForeground)

  if (t.background) element.style.setProperty("--color-background", t.background)
  if (t.foreground) element.style.setProperty("--color-foreground", t.foreground)

  if (t.card) element.style.setProperty("--color-card", t.card)
  if (t.cardForeground) element.style.setProperty("--color-card-foreground", t.cardForeground)

  if (t.border) element.style.setProperty("--color-border", t.border)
  if (t.input) element.style.setProperty("--color-input", t.input)
  if (t.inputBorder) element.style.setProperty("--color-input-border", t.inputBorder)
  if (t.ring) element.style.setProperty("--color-ring", t.ring)

  if (t.muted) element.style.setProperty("--color-muted", t.muted)
  if (t.mutedForeground) element.style.setProperty("--color-muted-foreground", t.mutedForeground)

  if (t.accent) element.style.setProperty("--color-accent", t.accent)
  if (t.accentHover) element.style.setProperty("--color-accent-hover", t.accentHover)
  if (t.accentForeground) element.style.setProperty("--color-accent-foreground", t.accentForeground)

  if (t.destructive) element.style.setProperty("--color-destructive", t.destructive)
  if (t.destructiveHover) element.style.setProperty("--color-destructive-hover", t.destructiveHover)
  if (t.destructiveForeground) element.style.setProperty("--color-destructive-foreground", t.destructiveForeground)

  if (t.success) element.style.setProperty("--color-success", t.success)
  if (t.successForeground) element.style.setProperty("--color-success-foreground", t.successForeground)

  if (t.warning) element.style.setProperty("--color-warning", t.warning)
  if (t.warningForeground) element.style.setProperty("--color-warning-foreground", t.warningForeground)

  if (t.info) element.style.setProperty("--color-info", t.info)
  if (t.infoForeground) element.style.setProperty("--color-info-foreground", t.infoForeground)

  // Border Radius
  if (t.radius) {
    if (t.radius.sm) element.style.setProperty("--radius-sm", t.radius.sm)
    if (t.radius.md) element.style.setProperty("--radius-md", t.radius.md)
    if (t.radius.lg) element.style.setProperty("--radius-lg", t.radius.lg)
    if (t.radius.xl) element.style.setProperty("--radius-xl", t.radius.xl)
    if (t.radius.xxl) element.style.setProperty("--radius-2xl", t.radius.xxl)
    if (t.radius.full) element.style.setProperty("--radius-full", t.radius.full)
  }

  // Typography
  if (t.typography?.fontFamily) {
    element.style.setProperty("--font-family", t.typography.fontFamily)
  }
  if (t.typography?.fontSize) {
    if (t.typography.fontSize.xs) element.style.setProperty("--font-size-xs", t.typography.fontSize.xs)
    if (t.typography.fontSize.sm) element.style.setProperty("--font-size-sm", t.typography.fontSize.sm)
    if (t.typography.fontSize.base) element.style.setProperty("--font-size-base", t.typography.fontSize.base)
    if (t.typography.fontSize.lg) element.style.setProperty("--font-size-lg", t.typography.fontSize.lg)
    if (t.typography.fontSize.xl) element.style.setProperty("--font-size-xl", t.typography.fontSize.xl)
  }

  // Shadows
  if (t.shadows) {
    if (t.shadows.sm) element.style.setProperty("--shadow-sm", t.shadows.sm)
    if (t.shadows.md) element.style.setProperty("--shadow-md", t.shadows.md)
    if (t.shadows.lg) element.style.setProperty("--shadow-lg", t.shadows.lg)
    if (t.shadows.xl) element.style.setProperty("--shadow-xl", t.shadows.xl)
    if (t.shadows.xxl) element.style.setProperty("--shadow-2xl", t.shadows.xxl)
  }

  // Layout
  if (t.layout) {
    if (t.layout.width) element.style.setProperty("--chat-width", t.layout.width)
    if (t.layout.height) element.style.setProperty("--chat-height", t.layout.height)
    if (t.layout.containerPadding) element.style.setProperty("--chat-padding", t.layout.containerPadding)
    if (t.layout.messagePadding) element.style.setProperty("--message-padding", t.layout.messagePadding)
  }

  console.log("✅ Theme applied successfully with all variables")
}

export function extractThemeFromBot(botConfig: BotConfiguration): Partial<ThemeConfig> {
  if (!botConfig?.theme_colors && !(botConfig as any)?.theme) {
    console.log("ℹ️  No theme in botConfig, using DEFAULT_THEME")
    return DEFAULT_THEME
  }

  const source = botConfig.theme_colors || (botConfig as any).theme || {}
  const layout = (botConfig.theme_layout || {}) as Partial<{
    size?: string
    width?: string
    height?: string
    borderRadius?: string
    buttonRadius?: string
    inputRadius?: string
    avatarRadius?: string
    containerPadding?: string
    messagePadding?: string
  }>

  // Handle size preset if provided
  let layoutConfig: Partial<{ width?: string; height?: string; containerPadding?: string; messagePadding?: string }> = {}
  if (layout.size && WIDGET_SIZES[layout.size as WidgetSize]) {
    const sizePreset = WIDGET_SIZES[layout.size as WidgetSize]
    layoutConfig = {
      width: sizePreset.width,
      height: sizePreset.height,
      containerPadding: layout.containerPadding,
      messagePadding: layout.messagePadding
    }
  } else {
    layoutConfig = {
      width: layout.width,
      height: layout.height,
      containerPadding: layout.containerPadding,
      messagePadding: layout.messagePadding
    }
  }

  return {
    primary: source.primary || DEFAULT_THEME.primary,
    primaryHover: source.primaryHover || source.primary_hover,
    primaryForeground: source.primaryForeground || source.primaryContent || DEFAULT_THEME.primaryForeground,

    secondary: source.secondary || DEFAULT_THEME.secondary,
    secondaryHover: source.secondaryHover || source.secondary_hover,
    secondaryForeground: source.secondaryForeground || source.secondaryContent || DEFAULT_THEME.secondaryForeground,

    background: source.background || source.base100 || DEFAULT_THEME.background,
    foreground: source.foreground || source.baseContent || DEFAULT_THEME.foreground,

    card: source.card || source.base200 || DEFAULT_THEME.card,
    cardForeground: source.cardForeground || source.baseContent || DEFAULT_THEME.cardForeground,

    border: source.border || source.base300 || DEFAULT_THEME.border,
    input: source.input || source.base100 || DEFAULT_THEME.input,
    inputBorder: source.inputBorder || source.base300 || DEFAULT_THEME.inputBorder,
    ring: source.ring || source.primary || DEFAULT_THEME.ring,

    muted: source.muted || source.neutral || DEFAULT_THEME.muted,
    mutedForeground: source.mutedForeground || source.neutralContent || DEFAULT_THEME.mutedForeground,

    accent: source.accent || DEFAULT_THEME.accent,
    accentHover: source.accentHover || source.accent_hover,
    accentForeground: source.accentForeground || source.accentContent || DEFAULT_THEME.accentForeground,

    destructive: source.destructive || source.error || DEFAULT_THEME.destructive,
    destructiveHover: source.destructiveHover || source.destructive_hover,
    destructiveForeground: source.destructiveForeground || source.errorContent || DEFAULT_THEME.destructiveForeground,

    success: source.success || DEFAULT_THEME.success,
    successForeground: source.successForeground || source.successContent || DEFAULT_THEME.successForeground,

    warning: source.warning || DEFAULT_THEME.warning,
    warningForeground: source.warningForeground || source.warningContent || DEFAULT_THEME.warningForeground,

    info: source.info || DEFAULT_THEME.info,
    infoForeground: source.infoForeground || source.infoContent || DEFAULT_THEME.infoForeground,

    radius: {
      sm: "0.375rem",
      md: (layout as any).buttonRadius || (layout as any).inputRadius || "0.5rem",
      lg: (layout as any).borderRadius || "0.75rem",
      xl: "1rem",
      xxl: "1.5rem",
      full: (layout as any).avatarRadius || "9999px"
    },

    layout: layoutConfig as any,

    typography: source.typography,
    shadows: source.shadows,
  }
}
