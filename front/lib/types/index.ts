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

export type VisitorInfo = {
  name: string;
  email: string;
};

export interface BotConfiguration {
  id: string;
  bot_name: string;
  welcome_message?: string;
  theme_config?: {
    primaryColor?: string;
    secondaryColor?: string;
    position?: 'bottom-right' | 'bottom-left';
    avatarSrc?: string;
    fontFamily?: string;
    borderRadius?: string;
    headerTitle?: string;
    headerSubtitle?: string;
  };
  feature_config?: {
    has_live_chat_agents?: boolean;
    agent_transfer_enabled?: boolean;
    file_upload_enabled?: boolean;
  };
  created_at?: string;
  updated_at?: string;
}

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