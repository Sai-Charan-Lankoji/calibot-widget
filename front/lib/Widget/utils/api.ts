import { 
  InitResponse, 
  MessageResponse,
  LiveChatMessage,
  LiveChatSession
} from '@/types';

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryableStatusCodes: number[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

export class WidgetApi {
  private baseUrl: string;
  private retryConfig: RetryConfig;

  constructor(baseUrl: string, retryConfig?: Partial<RetryConfig>) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  }

  /**
   * Generic fetch wrapper with error handling and retry logic
   */
  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {},
    signal?: AbortSignal
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        // Combine signals
        const combinedSignal = signal
          ? AbortSignal.any?.([signal, controller.signal]) || signal
          : controller.signal;

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          signal: combinedSignal,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });

        clearTimeout(timeoutId);

        // Handle non-JSON responses
        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
          throw new ApiError(
            'Invalid response format',
            response.status,
            'INVALID_RESPONSE'
          );
        }

        const data = await response.json();

        // Retry on specific status codes
        if (
          !response.ok &&
          this.retryConfig.retryableStatusCodes.includes(response.status) &&
          attempt < this.retryConfig.maxRetries
        ) {
          await new Promise((resolve) =>
            setTimeout(resolve, this.retryConfig.retryDelay * (attempt + 1))
          );
          continue;
        }

        if (!response.ok) {
          throw new ApiError(
            data.message || data.error || 'Request failed',
            response.status,
            data.code,
            data.details
          );
        }

        return data as T;
      } catch (error) {
        lastError = error as Error;

        // Don't retry if aborted
        if (error instanceof Error && error.name === 'AbortError') {
          throw error;
        }

        // Retry on network errors
        if (
          error instanceof TypeError &&
          attempt < this.retryConfig.maxRetries
        ) {
          console.log(
            `Retry attempt ${attempt + 1}/${this.retryConfig.maxRetries}...`
          );
          await new Promise((resolve) =>
            setTimeout(resolve, this.retryConfig.retryDelay * (attempt + 1))
          );
          continue;
        }

        // Don't retry ApiErrors
        if (error instanceof ApiError) {
          throw error;
        }
      }
    }

    throw new ApiError(
      lastError?.message || 'Request failed after retries',
      undefined,
      'NETWORK_ERROR'
    );
  }

  /**
   * Get bot configuration (theme + features)
   */
  async getBotTheme(botId: string, signal?: AbortSignal): Promise<{
    bot: {
      id: string;
      name: string;
      bot_name: string;
      welcome_message: string;
      theme_colors?: any;
      theme_typography?: any;
      theme_layout?: any;
      theme_branding?: any;
      feature_chat?: any;
      feature_ui?: any;
      feature_faq?: any;
      feature_forms?: any;
    };
  }> {
    return this.fetch(`/api/widget/init/${botId}`, { method: 'GET' }, signal);
  }

  // ============================================
  // LIVE CHAT SESSION ENDPOINTS (NEW)
  // ============================================

  /**
   * Start live chat session
   */
  async startLiveChatSession(
    botId: string,
    sessionData: {
      visitor_id: string;
      visitor_name: string;
      visitor_email: string;
      metadata?: Record<string, any>;
    },
    signal?: AbortSignal
  ): Promise<{
    session_id: string;
    session_token: string;
    resumed: boolean;
  }> {
    return this.fetch(
      '/api/live-chat/session/start',
      {
        method: 'POST',
        body: JSON.stringify({
          bot_id: botId,
          ...sessionData,
        }),
      },
      signal
    );
  }

  /**
   * Send message in live chat session
   */
  async sendSessionMessage(
    sessionId: string,
    messageData: {
      content: string;
      sender_type: 'VISITOR' | 'AGENT' | 'BOT';
      message_type: 'TEXT' | 'IMAGE' | 'FILE';
      file_url?: string;
    },
    signal?: AbortSignal
  ): Promise<{
    message: LiveChatMessage;
    bot_response?: LiveChatMessage;
  }> {
    return this.fetch(
      `/api/live-chat/session/${sessionId}/message`,
      {
        method: 'POST',
        body: JSON.stringify(messageData),
      },
      signal
    );
  }

  /**
   * Get session messages (with optional polling support)
   */
  async getSessionMessages(
    sessionId: string,
    after?: string,
    signal?: AbortSignal
  ): Promise<{ messages: LiveChatMessage[] }> {
    const queryParams = after ? `?after=${encodeURIComponent(after)}` : '';
    return this.fetch(
      `/api/live-chat/session/${sessionId}/messages${queryParams}`,
      { method: 'GET' },
      signal
    );
  }

  /**
   * Get session details
   */
  async getSessionDetails(
    sessionId: string,
    signal?: AbortSignal
  ): Promise<{ session: LiveChatSession }> {
    return this.fetch(
      `/api/live-chat/session/${sessionId}`,
      { method: 'GET' },
      signal
    );
  }

  /**
   * Transfer session to agent
   */
  async transferToAgent(
    sessionId: string,
    reason?: string,
    signal?: AbortSignal
  ): Promise<{
    success: boolean;
    queue_position: number;
    message: string;
  }> {
    return this.fetch(
      `/api/live-chat/session/${sessionId}/transfer`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      },
      signal
    );
  }

  /**
   * End live chat session
   */
  async endLiveChatSession(
    sessionId: string,
    signal?: AbortSignal
  ): Promise<{ success: boolean }> {
    return this.fetch(
      `/api/live-chat/session/${sessionId}/end`,
      {
        method: 'POST',
      },
      signal
    );
  }

  // ============================================
  // CONVERSATIONAL FAQ CHAT ENDPOINTS
  // ============================================

  /**
   * Start conversational chat session
   */
  async startChat(botId: string, signal?: AbortSignal): Promise<{
    session_id: string;
    greeting: string;
    company_name: string;
    has_questions: boolean;
    next_question?: {
      id: string;
      rank: number;
      question: string;
      options: string[] | null;
    };
    message?: string;
  }> {
    return this.fetch(
      `/api/chat/${botId}/start`,
      { method: 'POST' },
      signal
    );
  }

  /**
   * Send message in conversational chat
   */
  async sendChatMessage(
    botId: string,
    selectedOption: string,
    currentRank: number,
    signal?: AbortSignal
  ): Promise<{
    acknowledged?: string;
    next_question?: {
      id: string;
      rank: number;
      question: string;
      options: string[] | null;
    };
    end?: boolean;
    message?: string;
    transfer_to_human?: boolean;
    error?: string;
    repeat_question?: {
      id: string;
      rank: number;
      question: string;
      options: string[];
    };
  }> {
    return this.fetch(
      `/api/chat/${botId}/message`,
      {
        method: 'POST',
        body: JSON.stringify({
          selected_option: selectedOption,
          current_rank: currentRank,
        }),
      },
      signal
    );
  }

  // ============================================
  // DEPRECATED - OLD CONVERSATION ENDPOINTS
  // (Keep for backward compatibility, but redirect to new endpoints)
  // ============================================

  /**
   * @deprecated Use startLiveChatSession instead
   */
  async createConversation(
    botId: string,
    visitorInfo: { name: string; email: string },
    signal?: AbortSignal
  ): Promise<{
    conversation: any;
    sessionToken: string;
  }> {
    console.warn('⚠️ createConversation is deprecated, using startLiveChatSession');
    
    // Generate visitor ID
    const visitorId = localStorage.getItem('cali_visitor_id') || crypto.randomUUID();
    localStorage.setItem('cali_visitor_id', visitorId);
    
    const response = await this.startLiveChatSession(
      botId,
      {
        visitor_id: visitorId,
        visitor_name: visitorInfo.name,
        visitor_email: visitorInfo.email,
        metadata: {
          current_page_url: window.location.href,
          referrer_url: document.referrer,
          user_agent: navigator.userAgent,
        }
      },
      signal
    );
    
    // Transform response to match old format
    return {
      conversation: {
        id: response.session_id,
        bot_id: botId,
        visitor_info: visitorInfo,
        channel: 'web',
        status: 'ACTIVE',
        started_at: new Date().toISOString(),
      },
      sessionToken: response.session_token,
    };
  }

  /**
   * @deprecated Use sendSessionMessage instead
   */
  async sendMessage(
    conversationId: string,
    text: string,
    sessionToken: string,
    signal?: AbortSignal
  ): Promise<{
    message: any;
    botResponse?: any;
  }> {
    console.warn('⚠️ sendMessage is deprecated, using sendSessionMessage');
    
    return this.sendSessionMessage(
      conversationId,
      {
        content: text,
        sender_type: 'VISITOR',
        message_type: 'TEXT',
      },
      signal
    );
  }

  /**
   * @deprecated Use getSessionMessages instead
   */
  async getMessages(
    conversationId: string,
    signal?: AbortSignal
  ): Promise<{ messages: any[] }> {
    console.warn('⚠️ getMessages is deprecated, using getSessionMessages');
    return this.getSessionMessages(conversationId, undefined, signal);
  }

  /**
   * @deprecated Use endLiveChatSession instead
   */
  async endConversation(
    conversationId: string,
    sessionToken: string,
    signal?: AbortSignal
  ): Promise<{ success: boolean; conversation: any }> {
    console.warn('⚠️ endConversation is deprecated, using endLiveChatSession');
    
    await this.endLiveChatSession(conversationId, signal);
    
    return {
      success: true,
      conversation: { id: conversationId, status: 'CLOSED' },
    };
  }
}