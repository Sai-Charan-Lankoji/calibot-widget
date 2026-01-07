"use client"

import React, { useEffect, useState } from "react"
import type { BotConfiguration, WidgetConfig } from "@/types"
import { ChatInterface } from "./components/ChatInterface"
import { ToggleButton } from "./components/ToggleButton"
import { extractThemeFromBot, applyThemeToElement } from "./utils/theme-manager"
import { WidgetApi } from "./utils/api"
import "./theme-variables.css"

export const CaliChatWidget: React.FC<WidgetConfig & { onClose?: () => void; initialConfig?: BotConfiguration | null }> = ({
  botId,
  apiBaseUrl,
  primaryColor,
  avatarSrc,
  botName: propBotName,
  welcomeMessage: propWelcomeMessage,
  position = "bottom-right",
  useFavicon = true,
  onClose,
  initialConfig,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [botConfig, setBotConfig] = useState<BotConfiguration | null>(initialConfig || null)
  const [isLoading, setIsLoading] = useState(!initialConfig)
  const [error, setError] = useState<string | null>(null)
  const widgetRef = React.useRef<HTMLDivElement>(null)

  // Update internal state if initialConfig changes (for preview)
  useEffect(() => {
    if (initialConfig) {
      setBotConfig(initialConfig)
      setIsLoading(false)
      
      // Apply theme immediately
      if (widgetRef.current) {
        const theme = extractThemeFromBot(initialConfig)
        applyThemeToElement(widgetRef.current, theme, initialConfig.feature_ui?.darkMode)
      }
    }
  }, [initialConfig])

  useEffect(() => {
    // Skip fetch if we have initialConfig and it matches the botId (simple check)
    if (initialConfig && initialConfig.id === botId) return

    const fetchBotConfig = async () => {
      try {
        setIsLoading(true)
        const api = new WidgetApi(apiBaseUrl)
        
        const data = await api.getBotTheme(botId)
        const config = data.bot as BotConfiguration

        setBotConfig(config)

        // Apply theme to widget container
        if (widgetRef.current) {
          const theme = extractThemeFromBot(config)
          applyThemeToElement(widgetRef.current, theme, config.feature_ui?.darkMode)
        }

        setError(null)
        console.log('✅ Widget configuration loaded')
      } catch (err) {
        console.error("Failed to load widget configuration:", err)
        setError(err instanceof Error ? err.message : "Failed to load configuration")
        
        // Set default config so widget still works
        setBotConfig({
          id: botId,
          bot_name: propBotName || "Support",
          welcome_message: propWelcomeMessage || "How can we help?",
          theme_colors: {
  /* Primary brand color — Blue 500 */
  primary: "#3B82F6",          
  primaryContent: "#FFFFFF",     // White

  /* Secondary brand color — Slate 600 */
  secondary: "#64748B",
  secondaryContent: "#FFFFFF",   // White

  /* Accent / highlight color — Amber 500 */
  accent: "#F59E0B",
  accentContent: "#FFFFFF",      // White

  /* Neutral elements — Dark Gray 800 */
  neutral: "#333333",
  neutralContent: "#FFFFFF",     // White

  /* Base backgrounds & surfaces */
  base100: "#FFFFFF",  // White
  base200: "#F3F4F6",  // Gray 100
  base300: "#E5E7EB",  // Gray 200
  baseContent: "#1F2937", // Gray 800

  /* Semantic colors */
  info: "#3B82F6",    // Blue 500
  success: "#10B981", // Emerald 500
  warning: "#F59E0B", // Amber 500
  error: "#EF4444",   // Red 500

  // // /* Optional: Hover / focus variants */
  // // primaryFocus: "#2563EB",   // Blue 600
  // // secondaryFocus: "#475569", // Slate 700
  // // accentFocus: "#D97706",    // Amber 600

  // /* Text emphasis colors */
  // contentStrong: "#111827", // Gray 900
  // contentSoft: "#6B7280",   // Gray 500

  // /* Borders & rings */
  // borderColor: "#D1D5DB", // Gray 300
  // ringColor: "#93C5FD",   // Blue 300
},

          theme_typography: {
            fontFamily: "Inter, system-ui, sans-serif",
            fontSizeBase: "14px",
            fontSizeSmall: "12px",
            fontSizeLarge: "16px",
            fontWeightNormal: 400,
            fontWeightMedium: 500,
            fontWeightBold: 600,
            lineHeight: 1.5
          },
          theme_layout: {
            position: "bottom-right",
            width: "380px",
            height: "600px",
            borderRadius: "1rem",
            buttonRadius: "0.5rem",
            inputRadius: "0.5rem",
            avatarRadius: "9999px",
            containerPadding: "1rem",
            messagePadding: "0.75rem"
          },
          theme_branding: {
            logoUrl: null,
            avatarUrl: avatarSrc || null,
            faviconUrl: null,
            companyName: null,
            poweredByText: "Powered by Calibrage",
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
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (!initialConfig) {
      fetchBotConfig()
    }
  }, [botId, apiBaseUrl, propBotName, propWelcomeMessage, avatarSrc, initialConfig])

  const handleClose = () => {
    setIsOpen(false)
    onClose?.()
  }

  const handleOpen = () => {
    setIsOpen(true)
  }

  if (isLoading) {
    return (
      <div
        ref={widgetRef}
        className={`cali-chat-widget fixed bottom-4 z-50 ${position === "bottom-left" ? "left-4" : "right-4"}`}
      >
        <div className="w-14 h-14 rounded-full bg-theme-primary flex items-center justify-center animate-pulse">
          <div className="w-6 h-6 border-2 border-theme-primary-content border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  const finalBotName = propBotName || botConfig?.bot_name || "Support"
  const finalWelcomeMessage = propWelcomeMessage || botConfig?.welcome_message || "How can we help?"
  const finalAvatarSrc = avatarSrc || botConfig?.theme_branding?.avatarUrl || undefined

  return (
    <div
      ref={widgetRef}
      className={`cali-chat-widget fixed bottom-4 z-50 ${position === "bottom-left" ? "left-4" : "right-4"}`}
    >
      {isOpen && botConfig && (
        <div className="widget-animate-in mb-4">
          <ChatInterface
            botName={finalBotName}
            welcomeMessage={finalWelcomeMessage}
            avatarSrc={finalAvatarSrc}
            apiBaseUrl={apiBaseUrl}
            botId={botId}
            onClose={handleClose}
            botConfig={botConfig}
            featureChat={botConfig.feature_chat}
            featureUI={botConfig.feature_ui}
          />
        </div>
      )}

      {!isOpen && (
        <ToggleButton onClick={handleOpen} primaryColor={primaryColor} avatarSrc={finalAvatarSrc} />
      )}
    </div>
  )
}
