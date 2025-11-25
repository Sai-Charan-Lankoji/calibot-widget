import React, { useEffect, useState, useTransition } from "react";
import { WidgetConfig, BotConfiguration, ThemeColors, ThemeTypography, ThemeLayout } from "@/types";
import { cn } from "./utils/cn";
import { ToggleButton } from "./components/ToggleButton";
import { ChatInterface } from "./components/ChatInterface";
import { getFaviconUrl } from "./utils/favicon";
import { WidgetApi } from "./utils/api";
import "./globals.css";

// Default theme configuration
const DEFAULT_THEME_COLORS: Partial<ThemeColors> = {
  primary: 'oklch(67% 0.182 276.935)'
};

const DEFAULT_THEME_TYPOGRAPHY: Partial<ThemeTypography> = {
  fontFamily: 'Inter, system-ui, sans-serif'
};

const DEFAULT_THEME_LAYOUT: Partial<ThemeLayout> = {
  borderRadius: '1rem',
  position: 'bottom-right' as const
};

const DEFAULT_BOT_CONFIG: BotConfiguration = {
  id: 'fallback',
  bot_name: 'Support Assistant',
  welcome_message: 'Hi! How can I help you today?',
  theme_colors: DEFAULT_THEME_COLORS as any,
  theme_typography: DEFAULT_THEME_TYPOGRAPHY as any,
  theme_layout: DEFAULT_THEME_LAYOUT as any,
  feature_chat: {
    enableLiveChat: true,
    enableAI: false,
    autoAssignAgent: false,
    agentTransferEnabled: true,
    showTypingIndicator: true,
    messageDelay: 800
  }
};

function hexToHSL(hex: string): { h: number; s: number; l: number } {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function generateColorVariations(baseColor: string) {
  const { h, s, l } = hexToHSL(baseColor);
  return {
    primary: `${h} ${s}% ${l}%`,
    primaryHover: `${h} ${s}% ${Math.max(l - 5, 0)}%`,
    primaryContent: l > 50 ? '222 47% 11%' : '0 0% 100%',
  };
}

function applyThemeFromBot(bot: any, primaryColorProp?: string) {
  const themeColors = bot.theme_colors || DEFAULT_THEME_COLORS;
  const themeTypography = bot.theme_typography || DEFAULT_THEME_TYPOGRAPHY;
  const themeLayout = bot.theme_layout || DEFAULT_THEME_LAYOUT;
  
  if (primaryColorProp && primaryColorProp.startsWith('#')) {
    const colors = generateColorVariations(primaryColorProp);
    document.documentElement.style.setProperty('--color-primary', colors.primary);
    document.documentElement.style.setProperty('--color-primary-hover', colors.primaryHover);
    document.documentElement.style.setProperty('--color-primary-content', colors.primaryContent);
  } else if (themeColors.primary) {
    document.documentElement.style.setProperty('--color-primary', themeColors.primary);
  }

  if (themeTypography.fontFamily) {
    document.documentElement.style.setProperty('--font-family', themeTypography.fontFamily);
  }
  
  if (themeLayout.borderRadius) {
    document.documentElement.style.setProperty('--radius', themeLayout.borderRadius);
  }
}

function applyDefaultTheme(primaryColorProp?: string) {
  if (primaryColorProp && primaryColorProp.startsWith('#')) {
    const colors = generateColorVariations(primaryColorProp);
    document.documentElement.style.setProperty('--color-primary', colors.primary);
    document.documentElement.style.setProperty('--color-primary-hover', colors.primaryHover);
    document.documentElement.style.setProperty('--color-primary-content', colors.primaryContent);
  }
  document.documentElement.style.setProperty('--font-family', DEFAULT_THEME_TYPOGRAPHY.fontFamily!);
  document.documentElement.style.setProperty('--radius', DEFAULT_THEME_LAYOUT.borderRadius!);
}

export const CaliChatWidget: React.FC<WidgetConfig> = ({ 
  botId, 
  apiBaseUrl,
  primaryColor = '#3B82F6',
  avatarSrc,
  botName,
  welcomeMessage,
  position = 'bottom-right',
  useFavicon = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<{
    bot: BotConfiguration | null;
    detectedFavicon: string | null;
  }>({
    bot: null,
    detectedFavicon: null
  });

  useEffect(() => {
    const initWidget = async () => {
      const api = new WidgetApi(apiBaseUrl);

      try {
        // Detect favicon if needed
        if (useFavicon && !avatarSrc) {
          const favicon = getFaviconUrl();
          setState(prev => ({ ...prev, detectedFavicon: favicon }));
        }

        // Load theme configuration only
        try {
          const themeData = await api.getBotTheme(botId);
          
          setState(prev => ({ 
            ...prev, 
            bot: {
              id: botId,
              bot_name: botName || 'Support',
              welcome_message: welcomeMessage || 'How can we help?',
              ...themeData.bot
            } as any
          }));
          
          applyThemeFromBot(themeData.bot, primaryColor);
        } catch {
          console.log('Could not load theme, using defaults');
          setState(prev => ({ ...prev, bot: DEFAULT_BOT_CONFIG }));
          applyDefaultTheme(primaryColor);
        }

      } catch (error) {
        console.error('Widget initialization error:', error);
        setState(prev => ({ ...prev, bot: DEFAULT_BOT_CONFIG }));
        applyDefaultTheme(primaryColor);
      }
    };

    initWidget();
  }, [botId, apiBaseUrl, primaryColor, avatarSrc, botName, welcomeMessage, useFavicon]);

  const toggleWidget = () => {
    startTransition(() => {
      setIsOpen((prev) => !prev);
    });
  };

  const positionClass = position === 'bottom-left' ? 'left-4' : 'right-4';
  const finalAvatarSrc = avatarSrc || state.bot?.theme_branding?.avatarUrl || state.detectedFavicon;

  return (
    <div className={cn("cali-chat-widget fixed bottom-4 z-50", positionClass)}>
      {/* Chat Interface - Hidden when closed */}
      {isOpen && (
        <div className="widget-animate-in mb-4">
          <ChatInterface
            botName={botName || state.bot?.bot_name || 'Support'}
            welcomeMessage={welcomeMessage || state.bot?.welcome_message}
            avatarSrc={finalAvatarSrc || undefined}
            apiBaseUrl={apiBaseUrl}
            botId={botId}
            onClose={toggleWidget}
          />
        </div>
      )}

      {/* Toggle button - Always visible */}
      {!isOpen && (
        <ToggleButton 
          onClick={toggleWidget} 
          primaryColor={primaryColor}
          isLoading={isPending}
        />
      )}
    </div>
  );
};
