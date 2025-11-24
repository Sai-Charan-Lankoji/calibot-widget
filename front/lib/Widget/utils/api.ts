import { 
  InitResponse, 
  ConversationResponse, 
  MessageResponse, 
  Message,
  
  Conversation
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
  }
}

export class WidgetApi {
  private baseUrl: string;
  private retryAttempts = 3;
  private retryDelay = 1000;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  /**
   * Generic fetch wrapper with error handling and retry logic
   */
  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

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

      if (!response.ok) {
        const error = data as ApiError;
        throw new ApiError(
          error.message || 'Request failed',
          response.status,
          error.code,
          error.details
        );
      }

      return data as T;
    } catch (error) {
      // Retry on network errors
      if (
        error instanceof TypeError && 
        retryCount < this.retryAttempts
      ) {
        console.log(`Retry attempt ${retryCount + 1}/${this.retryAttempts}...`);
        await new Promise(resolve => 
          setTimeout(resolve, this.retryDelay * (retryCount + 1))
        );
        return this.fetch<T>(endpoint, options, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Initialize widget - get bot config and FAQs
   */
  async init(botId: string): Promise<InitResponse> {
    return this.fetch<InitResponse>(`/api/widget/init/${botId}`);
  }

  /**
   * Create new conversation
   */
  async createConversation(
    botId: string,
    visitorInfo: { name: string; email: string }
  ): Promise<ConversationResponse> {
    return this.fetch<ConversationResponse>('/api/conversations', {
      method: 'POST',
      body: JSON.stringify({
        botId,
        visitor_info: visitorInfo,
        channel: 'WEB_WIDGET',
        attributes: {}
      }),
    });
  }

  /**
   * Resume conversation by session token
   */
  async resumeSession(sessionToken: string): Promise<{
    conversation: Conversation;
    messages: Message[];
  }> {
    return this.fetch(`/api/conversations/session/${sessionToken}`);
  }

  /**
   * Send message
   */
  async sendMessage(
    conversationId: string,
    text: string,
    sessionToken: string
  ): Promise<MessageResponse> {
    return this.fetch<MessageResponse>(
      `/api/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({
          content: { text },
          sender_type: 'VISITOR',
          sessionToken
        }),
      }
    );
  }

  /**
   * End conversation
   */
  async endConversation(
    conversationId: string,
    sessionToken: string
  ): Promise<{ success: boolean; conversation: Conversation }> {
    return this.fetch(`/api/conversations/${conversationId}/end`, {
      method: 'POST',
      body: JSON.stringify({ sessionToken }),
    });
  }

  /**
   * Get conversation messages
   */
  async getMessages(conversationId: string): Promise<{ messages: Message[] }> {
    return this.fetch(`/api/conversations/${conversationId}/messages`);
  }
}