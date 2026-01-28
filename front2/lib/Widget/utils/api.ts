import {
  //InitResponse,
  ConversationResponse,
  MessageResponse,
  Message,
  Conversation,
} from "@/types";
import { logger } from "./logger";

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = "ApiError";
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
    this.baseUrl = baseUrl.replace(/\/$/, "");
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
            "Content-Type": "application/json",
            ...options.headers,
          },
        });

        clearTimeout(timeoutId);

        // Handle non-JSON responses
        const contentType = response.headers.get("content-type");
        if (!contentType?.includes("application/json")) {
          throw new ApiError(
            "Invalid response format",
            response.status,
            "INVALID_RESPONSE"
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
            data.message || data.error || "Request failed",
            response.status,
            data.code,
            data.details
          );
        }

        return data as T;
      } catch (error) {
        lastError = error as Error;

        // Don't retry if aborted
        if (error instanceof Error && error.name === "AbortError") {
          throw error;
        }

        // Retry on network errors
        if (
          error instanceof TypeError &&
          attempt < this.retryConfig.maxRetries
        ) {
          logger.log(
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
      lastError?.message || "Request failed after retries",
      undefined,
      "NETWORK_ERROR"
    );
  }

  /**
   * Initialize or resume chat session
   */
  async initSession(
    botId: string,
    sessionToken?: string,
    visitorId?: string,
    visitorInfo?: { name?: string; email?: string },
    signal?: AbortSignal
  ): Promise<{
    success: boolean;
    session_id: string;
    session_token: string;
    visitor_id: string;
    status: string;
    resumed: boolean;
  }> {
    return this.fetch(
      `/api/widget/${botId}/init`,
      {
        method: "POST",
        body: JSON.stringify({
          sessionToken,
          visitorId,
          visitorInfo,
        }),
      },
      signal
    );
  }

  /**
   * Start conversational chat session (now requires session credentials)
   */
  async startChat(
    botId: string,
    sessionId: string,
    sessionToken: string,
    signal?: AbortSignal
  ): Promise<{
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
      {
        method: "POST",
        body: JSON.stringify({
          session_id: sessionId,
          session_token: sessionToken,
        }),
      },
      signal
    );
  }

  /**
   * Send message in conversational chat (now includes session credentials)
   */
  async sendChatMessage(
    botId: string,
    selectedOption: string,
    currentFaqId: string,
    sessionId: string,
    sessionToken: string,
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
  }> {
    return this.fetch(
      `/api/chat/${botId}/message`,
      {
        method: "POST",
        body: JSON.stringify({
          selected_option: selectedOption,
          current_faq_id: currentFaqId,
          session_id: sessionId,
          session_token: sessionToken,
        }),
      },
      signal
    );
  }

  /**
   * Get bot configuration (theme + features)
   * This is the ONLY initial API call
   */
  async getBotTheme(
    botId: string,
    signal?: AbortSignal
  ): Promise<{
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
    // Use the correct endpoint that exists in your backend
    return this.fetch(`/api/widget/init/${botId}`, { method: "GET" , headers: { "ngrok-skip-browser-warning": "true" } }, signal);
  }

  /**
   * Create new conversation (for live chat escalation)
   */
  async createConversation(
    botId: string,
    visitorInfo: { name: string; email: string },
    signal?: AbortSignal
  ): Promise<ConversationResponse> {
    return this.fetch(
      "/api/conversations",
      {
        method: "POST",
        body: JSON.stringify({
          botId,
          visitor_info: visitorInfo,
          channel: "WEB_WIDGET",
          attributes: {
            current_page_url: window.location.href,
            referrer_url: document.referrer,
            user_agent: navigator.userAgent,
          },
        }),
      },
      signal
    );
  }

  /**
   * Send message in live chat conversation
   */
  async sendMessage(
    conversationId: string,
    text: string,
    sessionToken: string,
    signal?: AbortSignal
  ): Promise<MessageResponse> {
    return this.fetch(
      `/api/conversations/${conversationId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          content: { text },
          sender_type: "VISITOR",
        }),
      },
      signal
    );
  }

  /**
   * Get conversation messages (for polling)
   */
  async getMessages(
    conversationId: string,
    signal?: AbortSignal
  ): Promise<{ messages: Message[] }> {
    return this.fetch(
      `/api/conversations/${conversationId}/messages`,
      { method: "GET" },
      signal
    );
  }

  /**
   * End conversation
   */
  async endConversation(
    conversationId: string,
    sessionToken: string,
    signal?: AbortSignal
  ): Promise<{ success: boolean; conversation: Conversation }> {
    return this.fetch(
      `/api/conversations/${conversationId}/end`,
      {
        method: "POST",
        body: JSON.stringify({ sessionToken }),
      },
      signal
    );
  }
}
