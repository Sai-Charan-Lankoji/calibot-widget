/**
 * useWidgetState Hook
 * Centralized state management for the chat widget
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { BotConfiguration, WidgetConfig } from '@/types';
import { WidgetApi } from '../utils/api';
import { extractThemeFromBot, applyThemeToElement } from '../utils/theme-manager';
import { STORAGE_KEYS, TIMING, DEFAULT_COLORS, DEFAULT_TYPOGRAPHY } from '../constants';
import { logger } from '../utils/logger';

interface UseWidgetStateProps {
  config: WidgetConfig;
  widgetRef: React.RefObject<HTMLDivElement | null>;
}

interface UseWidgetStateReturn {
  // State
  isOpen: boolean;
  showWelcome: boolean;
  botConfig: BotConfiguration | null;
  isLoading: boolean;
  error: string | null;
  
  // Computed values
  position: 'bottom-left' | 'bottom-right';
  botName: string;
  welcomeMessage: string;
  avatarSrc: string | undefined;
  
  // Actions
  openWidget: () => void;
  closeWidget: () => void;
  toggleWidget: () => void;
  dismissWelcome: () => void;
}

/**
 * Creates default bot configuration when API fails
 */
function createDefaultBotConfig(props: WidgetConfig): BotConfiguration {
  return {
    id: props.botId,
    bot_name: props.botName || 'Support',
    welcome_message: props.welcomeMessage || 'How can we help?',
    theme_colors: DEFAULT_COLORS,
    theme_typography: DEFAULT_TYPOGRAPHY,
    theme_layout: {
      position: 'bottom-right',
      width: '380px',
      height: '600px',
      borderRadius: '16px',
      buttonRadius: '8px',
      inputRadius: '8px',
      avatarRadius: '9999px',
      bubbleRadius: '16px',
      containerPadding: '16px',
      messagePadding: '12px',
    },
    theme_branding: {
      logoUrl: null,
      avatarUrl: props.avatarSrc || null,
      faviconUrl: null,
      companyName: null,
      poweredByText: 'Powered by Calibrage',
      showPoweredBy: true,
    },
    feature_chat: {
      enableAI: false,
      messageDelay: 800,
      enableLiveChat: true,
      autoAssignAgent: true,
      showTypingIndicator: true,
      agentTransferEnabled: true,
    },
    feature_ui: {
      darkMode: false,
      animations: true,
      fileUpload: false,
      emojiPicker: true,
      maxFileSize: 5242880,
      soundEnabled: true,
    },
    feature_faq: {
      maxVisible: 5,
      showSearch: true,
      showFaqList: true,
      categorizeByTags: false,
    },
    feature_forms: {
      gdprConsent: false,
      requireName: true,
      requireEmail: true,
      requirePhone: false,
      privacyPolicyUrl: null,
      collectInfoTiming: 'on-demand',
    },
  };
}

export function useWidgetState({ config, widgetRef }: UseWidgetStateProps): UseWidgetStateReturn {
  // Core state
  const [isOpen, setIsOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [botConfig, setBotConfig] = useState<BotConfiguration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Prevent duplicate API calls
  const fetchedRef = useRef(false);

  // Apply theme helper
  const applyTheme = useCallback((cfg: BotConfiguration) => {
    if (widgetRef.current) {
      const theme = extractThemeFromBot(cfg);
      applyThemeToElement(widgetRef.current, theme, cfg.feature_ui?.darkMode);
    }
  }, [widgetRef]);

  // Handle initial config from props (for preview mode)
  useEffect(() => {
    if (config.initialConfig) {
      setBotConfig(config.initialConfig);
      setIsLoading(false);
      applyTheme(config.initialConfig);
    }
  }, [config.initialConfig, applyTheme]);

  // Fetch bot configuration from API
  useEffect(() => {
    // Skip if we have initialConfig matching botId
    if (config.initialConfig && config.initialConfig.id === config.botId) return;
    if (fetchedRef.current) return;

    const fetchBotConfig = async () => {
      try {
        fetchedRef.current = true;
        setIsLoading(true);
        
        const api = new WidgetApi(config.apiBaseUrl);
        const data = await api.getBotTheme(config.botId);
        const fetchedConfig = data.bot as BotConfiguration;

        setBotConfig(fetchedConfig);
        applyTheme(fetchedConfig);
        setError(null);
        
        logger.log('✅ Widget configuration loaded');
      } catch (err) {
        console.error('Failed to load widget configuration:', err);
        setError(err instanceof Error ? err.message : 'Failed to load configuration');
        
        // Use default config so widget still works
        const defaultConfig = createDefaultBotConfig(config);
        setBotConfig(defaultConfig);
        applyTheme(defaultConfig);
      } finally {
        setIsLoading(false);
      }
    };

    if (!config.initialConfig) {
      fetchBotConfig();
    }
  }, [config.botId, config.apiBaseUrl, config.initialConfig, applyTheme, config]);

  // Show welcome message on first load
  useEffect(() => {
    const hasSeenWelcome = sessionStorage.getItem(STORAGE_KEYS.SESSION.WELCOME_SEEN);
    
    if (!hasSeenWelcome && !isOpen) {
      const timer = setTimeout(() => {
        setShowWelcome(true);
      }, TIMING.DELAY.WELCOME_SHOW);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Actions
  const openWidget = useCallback(() => {
    setIsOpen(true);
    if (showWelcome) {
      setShowWelcome(false);
      sessionStorage.setItem(STORAGE_KEYS.SESSION.WELCOME_SEEN, 'true');
    }
  }, [showWelcome]);

  const closeWidget = useCallback(() => {
    setIsOpen(false);
    config.onClose?.();
  }, [config]);

  const toggleWidget = useCallback(() => {
    if (isOpen) {
      closeWidget();
    } else {
      openWidget();
    }
  }, [isOpen, openWidget, closeWidget]);

  const dismissWelcome = useCallback(() => {
    setShowWelcome(false);
    sessionStorage.setItem(STORAGE_KEYS.SESSION.WELCOME_SEEN, 'true');
  }, []);

  // Computed values
  const position = (config.position || botConfig?.theme_layout?.position || 'bottom-right') as 'bottom-left' | 'bottom-right';
  const botName = config.botName || botConfig?.bot_name || 'Support';
  const welcomeMessage = config.welcomeMessage || botConfig?.welcome_message || 'How can we help?';
  const avatarSrc = config.avatarSrc || botConfig?.theme_branding?.avatarUrl || undefined;

  return {
    // State
    isOpen,
    showWelcome,
    botConfig,
    isLoading,
    error,
    
    // Computed values
    position,
    botName,
    welcomeMessage,
    avatarSrc,
    
    // Actions
    openWidget,
    closeWidget,
    toggleWidget,
    dismissWelcome,
  };
}
