export interface FAQ {
  id: string
  question: string
  answer: string
}

export interface VisitorInfo {
  name: string
  email?: string
  phone?: string
}

export interface Conversation {
  id: string
  botId: string
  visitorInfo: VisitorInfo
  channel: string
  createdAt: string
  updatedAt: string
}

export interface BotConfiguration {
  id: string
  bot_name: string
  welcome_message: string
  theme_colors: Record<string, string>
  theme_typography: Record<string, string | number>
  theme_layout: Record<string, string>
  theme_branding: {
    logoUrl: string | null
    avatarUrl: string | null
    faviconUrl: string | null
    companyName: string | null
    poweredByText: string
    showPoweredBy: boolean
  }
  feature_chat: {
    enableAI: boolean
    messageDelay: number
    enableLiveChat: boolean
    autoAssignAgent: boolean
    showTypingIndicator: boolean
    agentTransferEnabled: boolean
  }
  feature_ui: {
    darkMode: boolean
    animations: boolean
    fileUpload: boolean
    emojiPicker: boolean
    maxFileSize: number
    soundEnabled: boolean
  }
  feature_faq: {
    maxVisible: number
    showSearch: boolean
    showFaqList: boolean
    categorizeByTags: boolean
  }
  feature_forms: {
    gdprConsent: boolean
    requireName: boolean
    requireEmail: boolean
    requirePhone: boolean
    privacyPolicyUrl: string | null
    collectInfoTiming: 'upfront' | 'on-demand'
  }
}

export interface WidgetConfig {
  botId: string
  apiBaseUrl: string
  primaryColor?: string
  avatarSrc?: string
  botName?: string
  welcomeMessage?: string
  position?: "bottom-left" | "bottom-right"
  useFavicon?: boolean
  /** Pre-loaded bot configuration (for preview mode) */
  initialConfig?: BotConfiguration
  /** Callback when widget is closed */
  onClose?: () => void
}