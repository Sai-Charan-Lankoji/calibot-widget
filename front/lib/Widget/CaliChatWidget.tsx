"use client"

import React, { useState, useEffect } from "react"
import { ChatInterface } from "./components/ChatInterface"
import { ToggleButton } from "./components/ToggleButton"
import { applyThemeToElement, extractThemeFromBot, DEFAULT_THEME } from "./utils/theme-manager"
import { updateFavicon } from "./utils/favicon"
import { WidgetApi } from "./utils/api"
import type { BotConfiguration } from "../types"
import "./globals.css"

export interface WidgetConfig {
  botId: string
  apiBaseUrl: string
  primaryColor?: string
  avatarSrc?: string
  botName?: string
  welcomeMessage?: string
  position?: "bottom-right" | "bottom-left"
  useFavicon?: boolean
}

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
  const [botConfig, setBotConfig] = useState<BotConfiguration | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [serverDown, setServerDown] = useState(false)
  const widgetRef = React.useRef<HTMLDivElement>(null)

  const positionClasses = position === "bottom-left" ? "left-4" : "right-4"

  // Handle initialConfig changes (for preview mode)
  useEffect(() => {
    if (initialConfig) {
      console.log("✅ Using provided initialConfig")
      
      // Apply theme IMMEDIATELY
      const theme = extractThemeFromBot(initialConfig)
      if (primaryColor) theme.primary = primaryColor
      applyThemeToElement(document.documentElement, theme)
      
      setBotConfig(initialConfig)
      setIsLoading(false)
      setServerDown(false)
    }
  }, [initialConfig, primaryColor])

  // Fetch bot config from API
  useEffect(() => {
    if (initialConfig) return // Don't fetch if config is provided

    let mounted = true

    const fetchBotConfig = async () => {
      try {
        console.log(`📡 Fetching bot config from ${apiBaseUrl}/api/widget/init/${botId}`)
        setIsLoading(true)
        
        const api = new WidgetApi(apiBaseUrl)
        const data = await api.getBotTheme(botId)
        
        if (!mounted) return

        const config = data.bot as BotConfiguration
        console.log("✅ Bot config loaded:", config)
        
        // Apply theme IMMEDIATELY before setting state
        const theme = extractThemeFromBot(config)
        if (primaryColor) theme.primary = primaryColor
        applyThemeToElement(document.documentElement, theme)
        
        setBotConfig(config)
        setServerDown(false)

        // Update favicon
        if (useFavicon && config.avatar) {
          updateFavicon(config.avatar, false)
        }

      } catch (err) {
        console.warn("⚠️ Failed to load bot config from server:", err)
        
        if (!mounted) return

        // Set server down flag
        setServerDown(true)

        // Create fallback config with defaults
        const fallbackConfig: BotConfiguration = {
          id: botId,
          bot_name: propBotName || "Support",
          welcome_message: propWelcomeMessage || "Hi! How can we help you today?",
          avatar: avatarSrc || undefined,
          theme_colors: {
            primary: primaryColor || DEFAULT_THEME.primary || "#2563eb",
            primaryContent: DEFAULT_THEME.primaryForeground || "#ffffff",
            secondary: DEFAULT_THEME.secondary || "#10b981",
            secondaryContent: DEFAULT_THEME.secondaryForeground || "#ffffff",
            accent: DEFAULT_THEME.accent || "#8b5cf6",
            accentContent: DEFAULT_THEME.accentForeground || "#ffffff",
            neutral: DEFAULT_THEME.muted || "#f3f4f6",
            neutralContent: DEFAULT_THEME.mutedForeground || "#6b7280",
            base100: DEFAULT_THEME.background || "#ffffff",
            base200: DEFAULT_THEME.card || "#f9fafb",
            base300: DEFAULT_THEME.border || "#e5e7eb",
            baseContent: DEFAULT_THEME.foreground || "#111827",
            info: DEFAULT_THEME.info || "#3b82f6",
            success: DEFAULT_THEME.success || "#10b981",
            warning: DEFAULT_THEME.warning || "#f59e0b",
            error: DEFAULT_THEME.destructive || "#ef4444",
          },
          feature_chat: {
            enableLiveChat: true,
            enableAI: true,
            autoAssignAgent: true,
            agentTransferEnabled: true,
            showTypingIndicator: true,
            messageDelay: 1000,
          },
          feature_ui: {
            fileUpload: true,
            maxFileSize: 5242880,
            emojiPicker: true,
            soundEnabled: true,
            animations: true,
            darkMode: false,
          },
        }

        console.log("🔧 Using fallback config:", fallbackConfig)
        
        // Apply default theme IMMEDIATELY
        const theme = { ...DEFAULT_THEME }
        if (primaryColor) theme.primary = primaryColor
        applyThemeToElement(document.documentElement, theme)
        
        setBotConfig(fallbackConfig)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    fetchBotConfig()

    return () => {
      mounted = false
    }
  }, [botId, apiBaseUrl, primaryColor, avatarSrc, propBotName, propWelcomeMessage, useFavicon, initialConfig])

  const handleClose = () => {
    setIsOpen(false)
    onClose?.()
  }

  const handleOpen = () => {
    setIsOpen(true)
  }

  // Show nothing while loading - wait for theme to load
  if (isLoading) {
    return null
  }

  // Don't render if no config (shouldn't happen due to fallback)
  if (!botConfig) {
    return null
  }

  const finalBotName = propBotName || botConfig.bot_name || "Support"
  const finalWelcomeMessage = propWelcomeMessage || botConfig.welcome_message || "Hi! How can we help you today?"
  const finalAvatarSrc = avatarSrc || botConfig.avatar

  return (
    <div ref={widgetRef} className={`cali-chat-widget fixed bottom-4 ${positionClasses} z-50`}>
      {/* Chat Interface */}
      {isOpen && (
        <div className="mb-4 animate-in fade-in slide-in-from-bottom-2">
          <ChatInterface
            botName={finalBotName}
            welcomeMessage={finalWelcomeMessage}
            avatarSrc={finalAvatarSrc}
            apiBaseUrl={apiBaseUrl}
            botId={botId}
            onClose={handleClose}
            botConfig={botConfig}
            serverDown={serverDown}
            featureUI={botConfig.feature_ui}
          />
        </div>
      )}

      {/* Toggle Button */}
      {!isOpen && (
        <ToggleButton
          onClick={handleOpen}
          avatarSrc={finalAvatarSrc}
          isLoading={false}
          hasError={serverDown}
        />
      )}

      {/* Offline indicator when closed */}
      {serverDown && !isOpen && (
        <div className="absolute bottom-20 right-0 bg-yellow-100 border border-yellow-300 text-yellow-800 px-3 py-1.5 rounded-lg shadow-sm text-xs whitespace-nowrap">
          Offline Mode
        </div>
      )}
    </div>
  )
}
