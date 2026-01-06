export interface ThemeConfig {
  colors: Record<string, string>
  typography: Record<string, string | number>
  layout: Record<string, string>
}

export const DEFAULT_THEME: ThemeConfig = {
  colors: {
    primary: "oklch(0.67 0.182 276.935)",
    primaryContent: "oklch(0.98 0 0)",
    secondary: "oklch(0.70 0.01 56.259)",
    secondaryContent: "oklch(0.14 0.004 49.25)",
    accent: "oklch(0.78 0.154 211.53)",
    accentContent: "oklch(0.30 0.056 229.695)",
    base100: "oklch(1 0 0)",
    base200: "oklch(0.96 0 0)",
    base300: "oklch(0.92 0 0)",
    baseContent: "oklch(0.14 0 0)",
    neutral: "oklch(0.14 0 0)",
    neutralContent: "oklch(0.98 0 0)",
    success: "oklch(0.72 0.219 149.579)",
    warning: "oklch(0.76 0.188 70.08)",
    error: "oklch(0.65 0.241 354.308)",
    info: "oklch(0.71 0.143 215.221)",
  },
  typography: {
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    fontSize: "14px",
    lineHeight: 1.5,
    fontWeightNormal: 400,
    fontWeightMedium: 500,
    fontWeightBold: 600,
  },
  layout: {
    borderRadius: "1.5rem",
    buttonRadius: "0.75rem",
    inputRadius: "0.75rem",
    avatarRadius: "9999px",
  },
}

export function extractThemeFromBot(bot: any): ThemeConfig {
  const themeColors = bot.theme_colors || {}
  const themeTypography = bot.theme_typography || {}
  const themeLayout = bot.theme_layout || {}

  return {
    colors: {
      primary: themeColors.primary || DEFAULT_THEME.colors.primary,
      primaryContent: themeColors.primaryContent || DEFAULT_THEME.colors.primaryContent,
      secondary: themeColors.secondary || DEFAULT_THEME.colors.secondary,
      secondaryContent: themeColors.secondaryContent || DEFAULT_THEME.colors.secondaryContent,
      accent: themeColors.accent || DEFAULT_THEME.colors.accent,
      accentContent: themeColors.accentContent || DEFAULT_THEME.colors.accentContent,
      base100: themeColors.base100 || DEFAULT_THEME.colors.base100,
      base200: themeColors.base200 || DEFAULT_THEME.colors.base200,
      base300: themeColors.base300 || DEFAULT_THEME.colors.base300,
      baseContent: themeColors.baseContent || DEFAULT_THEME.colors.baseContent,
      neutral: themeColors.neutral || DEFAULT_THEME.colors.neutral,
      neutralContent: themeColors.neutralContent || DEFAULT_THEME.colors.neutralContent,
      success: themeColors.success || DEFAULT_THEME.colors.success,
      warning: themeColors.warning || DEFAULT_THEME.colors.warning,
      error: themeColors.error || DEFAULT_THEME.colors.error,
      info: themeColors.info || DEFAULT_THEME.colors.info,
    },
    typography: {
      fontFamily: themeTypography.fontFamily || DEFAULT_THEME.typography.fontFamily,
      fontSize: themeTypography.fontSizeBase || DEFAULT_THEME.typography.fontSize,
      lineHeight: themeTypography.lineHeight || DEFAULT_THEME.typography.lineHeight,
      fontWeightNormal: themeTypography.fontWeightNormal || DEFAULT_THEME.typography.fontWeightNormal,
      fontWeightMedium: themeTypography.fontWeightMedium || DEFAULT_THEME.typography.fontWeightMedium,
      fontWeightBold: themeTypography.fontWeightBold || DEFAULT_THEME.typography.fontWeightBold,
    },
    layout: {
      borderRadius: themeLayout.borderRadius || DEFAULT_THEME.layout.borderRadius,
      buttonRadius: themeLayout.buttonRadius || DEFAULT_THEME.layout.buttonRadius,
      inputRadius: themeLayout.inputRadius || DEFAULT_THEME.layout.inputRadius,
      avatarRadius: themeLayout.avatarRadius || DEFAULT_THEME.layout.avatarRadius,
    },
  }
}

export function applyThemeToElement(element: HTMLElement, theme: ThemeConfig) {
  if (!element) return

  // Apply colors
  element.style.setProperty("--theme-primary", theme.colors.primary)
  element.style.setProperty("--theme-primary-content", theme.colors.primaryContent)
  element.style.setProperty("--theme-secondary", theme.colors.secondary)
  element.style.setProperty("--theme-secondary-content", theme.colors.secondaryContent)
  element.style.setProperty("--theme-accent", theme.colors.accent)
  element.style.setProperty("--theme-accent-content", theme.colors.accentContent)
  element.style.setProperty("--theme-base-100", theme.colors.base100)
  element.style.setProperty("--theme-base-200", theme.colors.base200)
  element.style.setProperty("--theme-base-300", theme.colors.base300)
  element.style.setProperty("--theme-base-content", theme.colors.baseContent)
  element.style.setProperty("--theme-neutral", theme.colors.neutral)
  element.style.setProperty("--theme-neutral-content", theme.colors.neutralContent)
  element.style.setProperty("--theme-success", theme.colors.success)
  element.style.setProperty("--theme-warning", theme.colors.warning)
  element.style.setProperty("--theme-error", theme.colors.error)
  element.style.setProperty("--theme-info", theme.colors.info)

  // Apply typography
  element.style.setProperty("--theme-font-family", theme.typography.fontFamily as string)
  element.style.setProperty("--theme-font-size", theme.typography.fontSize as string)
  element.style.setProperty("--theme-line-height", theme.typography.lineHeight.toString())
  element.style.setProperty("--theme-font-weight-normal", theme.typography.fontWeightNormal.toString())
  element.style.setProperty("--theme-font-weight-medium", theme.typography.fontWeightMedium.toString())
  element.style.setProperty("--theme-font-weight-bold", theme.typography.fontWeightBold.toString())

  // Apply layout
  element.style.setProperty("--theme-border-radius", theme.layout.borderRadius as string)
  element.style.setProperty("--theme-button-radius", theme.layout.buttonRadius as string)
  element.style.setProperty("--theme-input-radius", theme.layout.inputRadius as string)
  element.style.setProperty("--theme-avatar-radius", theme.layout.avatarRadius as string)
}
