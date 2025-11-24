import React, { useEffect, useState, Activity } from "react";
import { WidgetConfig, BotConfiguration, FAQ } from "@/types";
import { cn } from "./utils/cn";
import { ToggleButton } from "./components/ToggleButton";
import { ChatInterface } from "./components/ChatInterface";
import { getFaviconUrl } from "./utils/favicon";
import "./globals.css";

interface WidgetState {
  isOpen: boolean;
  bot: BotConfiguration | null;
  faqs: FAQ[];
  isLoading: boolean;
  error: string | null;
  detectedFavicon: string | null;
}

const DEFAULT_BOT_CONFIG: BotConfiguration = {
  id: 'fallback',
  bot_name: 'Support Assistant',
  welcome_message: 'Hi! Our chat service is currently unavailable, but here are some common questions that might help.',
  theme_config: {
    primaryColor: '#3B82F6',
    position: 'bottom-right'
  },
  feature_config: {
    has_live_chat_agents: false,
    agent_transfer_enabled: false
  }
};

const DEFAULT_FAQS: FAQ[] = [
  {
    id: 'faq-1',
    question: 'Why is the chat not working?',
    answer: 'The chat service may be temporarily unavailable due to maintenance or connectivity issues. Please try again in a few minutes.',
    tags: ['technical', 'troubleshooting']
  },
  {
    id: 'faq-2',
    question: 'How can I contact support?',
    answer: 'You can reach our support team via email at support@example.com or call us during business hours.',
    tags: ['contact', 'support']
  },
  {
    id: 'faq-3',
    question: 'What are your business hours?',
    answer: 'We are available Monday to Friday, 9 AM - 6 PM EST. Weekend support is available via email.',
    tags: ['hours', 'availability']
  }
];

function hexToHSL(hex: string): { h: number; s: number; l: number } {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0,  l = (max + min) / 2;
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
  const [state, setState] = useState<{
    bot: BotConfiguration | null;
    faqs: FAQ[];
    detectedFavicon: string | null;
  }>({
    bot: null,
    faqs: [],
    detectedFavicon: null
  });

  useEffect(() => {
    const initWidget = async () => {
      try {
        if (useFavicon && !avatarSrc) {
          const favicon = getFaviconUrl();
          setState(prev => ({ ...prev, detectedFavicon: favicon }));
        }

        const response = await fetch(`${apiBaseUrl}/api/widget/init/${botId}`);
        if (!response.ok) throw new Error('Failed to initialize widget');
        
        const data = await response.json();
        setState(prev => ({ ...prev, bot: data.bot, faqs: data.faqs }));
        
        const color = data.bot.theme_config?.primaryColor || primaryColor;
        if (color.startsWith('#')) {
          const colors = generateColorVariations(color);
          document.documentElement.style.setProperty('--color-primary', colors.primary);
          document.documentElement.style.setProperty('--color-primary-hover', colors.primaryHover);
          document.documentElement.style.setProperty('--color-primary-content', colors.primaryContent);
        }

        if (data.bot.theme_config?.fontFamily) {
          document.documentElement.style.setProperty('--font-family', data.bot.theme_config.fontFamily);
        }
        
        if (data.bot.theme_config?.borderRadius) {
          document.documentElement.style.setProperty('--radius', data.bot.theme_config.borderRadius);
        }

      } catch (error) {
        console.error('Widget initialization error:', error);
        setState(prev => ({ ...prev, bot: DEFAULT_BOT_CONFIG, faqs: DEFAULT_FAQS }));
      }
    };

    initWidget();
  }, [botId, apiBaseUrl, primaryColor, avatarSrc, useFavicon]);

  const positionClass = position === 'bottom-left' ? 'left-4' : 'right-4';
  const finalAvatarSrc = avatarSrc || state.bot?.theme_config?.avatarSrc || state.detectedFavicon;

  return (
    <div className={cn("cali-chat-widget fixed bottom-4 z-50", positionClass)}>
      {/* React 19.2: Activity API - Preserve chat state when minimized */}
      <Activity mode={isOpen ? 'visible' : 'hidden'}>
        <div className="widget-animate-in">
          <ChatInterface
            botName={botName || state.bot?.bot_name || 'Support'}
            welcomeMessage={welcomeMessage || state.bot?.welcome_message}
            avatarSrc={finalAvatarSrc || undefined}
            faqs={state.faqs}
            apiBaseUrl={apiBaseUrl}
            botId={botId}
            onClose={() => setIsOpen(false)}
          />
        </div>
      </Activity>

      {/* Toggle button only visible when chat is closed */}
      <Activity mode={!isOpen ? 'visible' : 'hidden'}>
        <ToggleButton onClick={() => setIsOpen(true)} primaryColor={primaryColor} />
      </Activity>
    </div>
  );
};
