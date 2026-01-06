import { useState, useCallback, useRef, useEffect } from 'react';
import { WidgetApi } from '../utils/api';
import { SessionManager, VisitorManager, ChatStorageManager } from '../utils/session';
import { LiveChatMessage } from '@/types';

interface UseLiveChatOptions {
  botId: string;
  apiBaseUrl: string;
  onError?: (error: Error) => void;
}

export function useLiveChat({ botId, apiBaseUrl, onError }: UseLiveChatOptions) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  const apiRef = useRef(new WidgetApi(apiBaseUrl));
  const abortControllerRef = useRef<AbortController | null>(null);
  const pollIntervalRef = useRef<number | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const existingSession = SessionManager.get();
    if (existingSession) {
      console.log('📂 Resuming existing session:', existingSession.sessionId);
      setSessionId(existingSession.sessionId);
      // Optionally load messages
      loadMessages(existingSession.sessionId);
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const loadMessages = useCallback(async (sessionId: string) => {
    try {
      const response = await apiRef.current.getSessionMessages(sessionId);
      setMessages(response.messages);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }, []);

  const startSession = useCallback(async (visitorInfo: {
    name: string;
    email: string;
  }) => {
    setIsConnecting(true);

    try {
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      const visitorId = VisitorManager.getOrCreateVisitorId();

      const response = await apiRef.current.startLiveChatSession(
        botId,
        {
          visitor_id: visitorId,
          visitor_name: visitorInfo.name,
          visitor_email: visitorInfo.email,
          metadata: {
            page_url: window.location.href,
            referrer: document.referrer,
            user_agent: navigator.userAgent
          }
        },
        abortControllerRef.current.signal
      );

      // Store in sessionStorage
      ChatStorageManager.initSession({
        sessionId: response.session_id,
        sessionToken: response.session_token,
        botId: botId,
        visitorInfo
      });

      setSessionId(response.session_id);
      setIsConnecting(false);
      
      return response;
    } catch (error: any) {
      if (error.name === 'AbortError') return null;

      setIsConnecting(false);
      onError?.(error);
      throw error;
    }
  }, [botId, onError]);

  const sendMessage = useCallback(async (text: string) => {
    const currentSessionId = sessionId || SessionManager.getSessionId();
    
    if (!currentSessionId) {
      throw new Error('No active session');
    }

    try {
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      const response = await apiRef.current.sendSessionMessage(
        currentSessionId,
        {
          content: text,
          sender_type: 'VISITOR',
          message_type: 'TEXT'
        },
        abortControllerRef.current.signal
      );

      // Add messages to state
      const newMessages: LiveChatMessage[] = [response.message];
      if (response.bot_response) {
        newMessages.push(response.bot_response);
      }

      setMessages((prev) => [...prev, ...newMessages]);
      
      // Update activity timestamp
      SessionManager.touchActivity();

      return response;
    } catch (error: any) {
      if (error.name === 'AbortError') return null;

      onError?.(error);
      throw error;
    }
  }, [sessionId, onError]);

  const startPolling = useCallback(() => {
    const currentSessionId = sessionId || SessionManager.getSessionId();
    
    if (!currentSessionId || isPolling) return;

    setIsPolling(true);

    pollIntervalRef.current = window.setInterval(async () => {
      try {
        const lastMessage = messages[messages.length - 1];
        const response = await apiRef.current.getSessionMessages(
          currentSessionId,
          lastMessage?.created_at
        );

        if (response.messages.length > 0) {
          setMessages((prev) => [...prev, ...response.messages]);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000);
  }, [sessionId, messages, isPolling]);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
      setIsPolling(false);
    }
  }, []);

  const endSession = useCallback(async () => {
    const currentSessionId = sessionId || SessionManager.getSessionId();
    
    if (!currentSessionId) return;

    try {
      await apiRef.current.endLiveChatSession(currentSessionId);
      
      ChatStorageManager.endSession(false); // Don't clear visitor ID
      
      setSessionId(null);
      setMessages([]);
      stopPolling();
    } catch (error: any) {
      onError?.(error);
      throw error;
    }
  }, [sessionId, stopPolling, onError]);

  return {
    sessionId: sessionId || SessionManager.getSessionId(),
    messages,
    isConnecting,
    isPolling,
    startSession,
    sendMessage,
    startPolling,
    stopPolling,
    endSession,
  };
}