import { logger } from './logger';

export interface ThemeConfig {
  colors: Record<string, string>
  typography: Record<string, string | number>
  layout: Record<string, string>
}

/**
 * Convert rem values to px (1rem = 16px)
 * This is critical for Shadow DOM isolation - rem units are relative to
 * the host page's root font-size, not the widget's.
 */
function remToPx(value: string | undefined | null): string {
  // Handle null/undefined
  
  if (!value) return '';
  
  // Normalize to string
  const strValue = String(value).trim();
  
  // If already in px, return as-is
  if (strValue.endsWith('px')) return strValue;
  
  // Handle special case of full round (circle)
  if (strValue === '9999px' || strValue === 'full') return '9999px';
  
  // Handle rem values
  if (strValue.includes('rem')) {
    const match = strValue.match(/^([\d.]+)\s*rem$/);
    if (match) {
      const remValue = parseFloat(match[1]);
      const pxValue = Math.round(remValue * 16);
      logger.log(`[theme-manager] Converting ${strValue} → ${pxValue}px`);
      return `${pxValue}px`;
    }
  }
  
  // Handle plain numbers (assume px)
  if (/^\d+$/.test(strValue)) {
    return `${strValue}px`;
  }
  
  return strValue;
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
    borderRadius: "24px",    // Was 1.5rem
    buttonRadius: "12px",    // Was 0.75rem
    inputRadius: "12px",     // Was 0.75rem
    avatarRadius: "9999px",
    bubbleRadius: "16px",    // Chat bubble border radius
  },
}

export function extractThemeFromBot(bot: any): ThemeConfig {
  const themeColors = bot.theme_colors || {}
  const themeTypography = bot.theme_typography || {}
  const themeLayout = bot.theme_layout || {}

  // Debug: Log incoming theme values
  logger.log('[theme-manager] extractThemeFromBot - theme_typography:', themeTypography);
  logger.log('[theme-manager] extractThemeFromBot - theme_layout:', themeLayout);

  // Convert layout values from rem to px for Shadow DOM compatibility
  const convertedLayout = {
    borderRadius: themeLayout.borderRadius ? remToPx(themeLayout.borderRadius) : DEFAULT_THEME.layout.borderRadius,
    buttonRadius: themeLayout.buttonRadius ? remToPx(themeLayout.buttonRadius) : DEFAULT_THEME.layout.buttonRadius,
    inputRadius: themeLayout.inputRadius ? remToPx(themeLayout.inputRadius) : DEFAULT_THEME.layout.inputRadius,
    avatarRadius: themeLayout.avatarRadius ? remToPx(themeLayout.avatarRadius) : DEFAULT_THEME.layout.avatarRadius,
    bubbleRadius: themeLayout.bubbleRadius ? remToPx(themeLayout.bubbleRadius) : DEFAULT_THEME.layout.bubbleRadius,
  };

  // Debug: Log converted layout values
  logger.log('[theme-manager] extractThemeFromBot - convertedLayout:', convertedLayout);

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
      fontSize: themeTypography.fontSize || themeTypography.fontSizeBase || DEFAULT_THEME.typography.fontSize,
      lineHeight: themeTypography.lineHeight || DEFAULT_THEME.typography.lineHeight,
      fontWeightNormal: themeTypography.fontWeightNormal || DEFAULT_THEME.typography.fontWeightNormal,
      fontWeightMedium: themeTypography.fontWeightMedium || DEFAULT_THEME.typography.fontWeightMedium,
      fontWeightBold: themeTypography.fontWeightBold || DEFAULT_THEME.typography.fontWeightBold,
    },
    layout: convertedLayout,
  }
}

export function applyThemeToElement(element: HTMLElement, theme: ThemeConfig, darkMode = false) {
  if (!element) return

  // Define dark mode color overrides - only override base/neutral colors, keep brand colors
  const darkColors = darkMode ? {
    // Keep brand colors from theme config (primary, secondary, accent)
    primary: theme.colors.primary,
    primaryContent: theme.colors.primaryContent,
    secondary: theme.colors.secondary,
    secondaryContent: theme.colors.secondaryContent,
    accent: theme.colors.accent,
    accentContent: theme.colors.accentContent,
    
    // Override only base colors for dark backgrounds
    base100: "oklch(0.18 0 0)",
    base200: "oklch(0.22 0 0)",
    base300: "oklch(0.28 0 0)",
    baseContent: "oklch(0.95 0 0)",
    
    // Override neutral colors for dark mode
    neutral: "oklch(0.85 0 0)",
    neutralContent: "oklch(0.15 0 0)",
    
    // Keep success color from theme
    success: theme.colors.success,
  } : theme.colors

  // Apply colors (use dark mode colors if enabled)
  element.style.setProperty("--theme-primary", darkColors.primary)
  element.style.setProperty("--theme-primary-content", darkColors.primaryContent)
  element.style.setProperty("--theme-secondary", darkColors.secondary)
  element.style.setProperty("--theme-secondary-content", darkColors.secondaryContent)
  element.style.setProperty("--theme-accent", darkColors.accent)
  element.style.setProperty("--theme-accent-content", darkColors.accentContent)
  element.style.setProperty("--theme-base-100", darkColors.base100)
  element.style.setProperty("--theme-base-200", darkColors.base200)
  element.style.setProperty("--theme-base-300", darkColors.base300)
  element.style.setProperty("--theme-base-content", darkColors.baseContent)
  element.style.setProperty("--theme-neutral", darkColors.neutral)
  element.style.setProperty("--theme-neutral-content", darkColors.neutralContent)
  element.style.setProperty("--theme-success", darkColors.success)

  // Apply typography
  logger.log('[theme-manager] applyThemeToElement - typography:', theme.typography);
  element.style.setProperty("--theme-font-family", theme.typography.fontFamily as string)
  element.style.setProperty("--theme-font-size", (theme.typography.fontSize || '14px') as string)
  logger.log('[theme-manager] Applied --theme-font-size:', theme.typography.fontSize || '14px');
  element.style.setProperty("--theme-line-height", (theme.typography.lineHeight || 1.5).toString())
  element.style.setProperty("--theme-font-weight-normal", (theme.typography.fontWeightNormal || 400).toString())
  element.style.setProperty("--theme-font-weight-medium", (theme.typography.fontWeightMedium || 500).toString())
  element.style.setProperty("--theme-font-weight-bold", (theme.typography.fontWeightBold || 600).toString())

  // Apply layout
  logger.log('[theme-manager] applyThemeToElement - layout values:', theme.layout);
  element.style.setProperty("--theme-border-radius", theme.layout.borderRadius as string)
  element.style.setProperty("--theme-button-radius", theme.layout.buttonRadius as string)
  element.style.setProperty("--theme-input-radius", theme.layout.inputRadius as string)
  element.style.setProperty("--theme-avatar-radius", theme.layout.avatarRadius as string)
  element.style.setProperty("--theme-bubble-radius", theme.layout.bubbleRadius as string)
}

