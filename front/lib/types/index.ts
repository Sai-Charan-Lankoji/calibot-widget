export interface WidgetConfig {
  botId: string;
  apiBaseUrl: string;
  primaryColor?: string;
  avatarSrc?: string;
  botName?: string;
  welcomeMessage?: string;
  position?: 'bottom-right' | 'bottom-left';
  useFavicon?: boolean; // New option - defaults to true
}

export interface BotConfiguration {
  id: string;
  bot_name: string;
  welcome_message: string;
  theme_config: {
    primaryColor?: string;
    avatarSrc?: string;
    position?: 'bottom-right' | 'bottom-left';
  };
  feature_config: {
    has_live_chat_agents: boolean;
    agent_transfer_enabled: boolean;
  };
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  answer_html?: string;
  tags: string[];
}

export interface VisitorInfo {
  name: string;
  email: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'USER' | 'BOT' | 'AGENT';
  content: {
    text: string;
  };
  timestamp: string;
}

export interface Conversation {
  id: string;
  status: 'ACTIVE' | 'ENDED' | 'PENDING_AGENT';
  visitor_info?: VisitorInfo;
  started_at: string;
}

export type ViewState = 'closed' | 'faq-list' | 'faq-detail' | 'visitor-form' | 'chat';