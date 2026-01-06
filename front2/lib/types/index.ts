// Theme and Feature Configuration Types
// Matches the new flat database column structure

export interface ThemeColors {
  primary: string;
  primaryContent: string;
  secondary: string;
  secondaryContent: string;
  accent: string;
  accentContent: string;
  neutral: string;
  neutralContent: string;
  base100: string;
  base200: string;
  base300: string;
  baseContent: string;
  info: string;
  success: string;
  warning: string;
  error: string;
}

export interface ThemeTypography {
  fontFamily: string;
  fontSizeBase: string;
  fontSizeSmall: string;
  fontSizeLarge: string;
  fontWeightNormal: number;
  fontWeightMedium: number;
  fontWeightBold: number;
  lineHeight: number;
}

export interface ThemeLayout {
  position: 'bottom-right' | 'bottom-left';
  width: string;
  height: string;
  borderRadius: string;
  buttonRadius: string;
  inputRadius: string;
  avatarRadius: string;
  containerPadding: string;
  messagePadding: string;
}

export interface ThemeBranding {
  logoUrl: string | null;
  faviconUrl: string | null;
  avatarUrl: string | null;
  companyName: string | null;
  poweredByText: string;
  showPoweredBy: boolean;
}

export interface FeatureChat {
  enableLiveChat: boolean;
  enableAI: boolean;
  autoAssignAgent: boolean;
  agentTransferEnabled: boolean;
  showTypingIndicator: boolean;
  messageDelay: number;
}

export interface FeatureUI {
  fileUpload: boolean;
  maxFileSize: number;
  emojiPicker: boolean;
  soundEnabled: boolean;
  animations: boolean;
  darkMode: boolean;
}

export interface FeatureFAQ {
  showFaqList: boolean;
  showSearch: boolean;
  maxVisible: number;
  categorizeByTags: boolean;
}

export interface FeatureForms {
  requireName: boolean;
  requireEmail: boolean;
  requirePhone: boolean;
  gdprConsent: boolean;
  privacyPolicyUrl: string | null;
}

// Updated Bot Configuration
export interface BotConfiguration {
  id: string;
  bot_name: string;
  welcome_message?: string;

  // Theme columns (flat structure)
  theme_colors?: ThemeColors;
  theme_typography?: ThemeTypography;
  theme_layout?: ThemeLayout;
  theme_branding?: ThemeBranding;

  // Feature columns (flat structure)
  feature_chat?: FeatureChat;
  feature_ui?: FeatureUI;
  feature_faq?: FeatureFAQ;
  feature_forms?: FeatureForms;

  created_at?: string;
  updated_at?: string;
}

// Keep existing types for backward compatibility
export type VisitorInfo = {
  name: string;
  email: string;
};

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  answer_html?: string;
  tags?: string[];
  category?: string;
  order?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'USER' | 'BOT' | 'AGENT';
  content: {
    text: string;
    type?: 'text' | 'file' | 'image';
    metadata?: Record<string, any>;
  };
  timestamp: string;
  status?: 'sending' | 'sent' | 'failed';
  agent_info?: {
    name: string;
    avatar?: string;
  };
}

export interface Conversation {
  id: string;
  bot_id: string;
  visitor_info: {
    name: string;
    email: string;
  };
  channel: string;
  status: 'ACTIVE' | 'CLOSED' | 'TRANSFERRED';
  started_at: string;
  ended_at?: string;
  attributes?: Record<string, any>;
}

export interface ChatSession {
  sessionToken: string;
  conversationId: string;
  visitorInfo: {
    name: string;
    email: string;
  };
  createdAt: string;
}

export interface InitResponse {
  bot: BotConfiguration;
  faqs: FAQ[];
}

export interface ConversationResponse {
  conversation: Conversation;
  sessionToken: string;
}

export interface MessageResponse {
  message: Message;
  botResponse?: Message;
}

// Legacy widget config (for existing implementations)
export interface WidgetConfig {
  botId: string;
  apiBaseUrl: string;
  primaryColor?: string;
  botName?: string;
  position?: 'bottom-right' | 'bottom-left';
  welcomeMessage?: string;
  avatarSrc?: string;
  useFavicon?: boolean;
}

