import { useState, useCallback, useRef, useEffect } from 'react';
import { WidgetApi } from '../utils/api';
import { Conversation, Message } from '@/types';

interface UseLiveChatOptions {
  botId: string;
  apiBaseUrl: string;
  onError?: (error: Error) => void;
}

export function useLiveChat({ botId, apiBaseUrl, onError }: UseLiveChatOptions) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  const apiRef = useRef(new WidgetApi(apiBaseUrl));
  const abortControllerRef = useRef<AbortController | null>(null);
  const pollIntervalRef = useRef<number | null>(null);

  // Cleanup
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const startConversation = useCallback(async (visitorInfo: {
    name: string;
    email: string;
  }) => {
    setIsConnecting(true);

    try {
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      const response = await apiRef.current.createConversation(
        botId,
        visitorInfo,
        abortControllerRef.current.signal
      );

      setConversation(response.conversation);
      setSessionToken(response.sessionToken);

      // Store in localStorage
      localStorage.setItem(
        `cali_chat_${botId}`,
        JSON.stringify({
          conversationId: response.conversation.id,
          sessionToken: response.sessionToken,
          visitorInfo,
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        })
      );

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
    if (!conversation || !sessionToken) {
      throw new Error('No active conversation');
    }

    try {
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      const response = await apiRef.current.sendMessage(
        conversation.id,
        text,
        sessionToken,
        abortControllerRef.current.signal
      );

      // Add messages to state
      const newMessages: Message[] = [response.message];
      if (response.botResponse) {
        newMessages.push(response.botResponse);
      }

      setMessages((prev) => [...prev, ...newMessages]);

      return response;
    } catch (error: any) {
      if (error.name === 'AbortError') return null;

      onError?.(error);
      throw error;
    }
  }, [conversation, sessionToken, onError]);

  const startPolling = useCallback(() => {
    if (!conversation || isPolling) return;

    setIsPolling(true);

    pollIntervalRef.current = window.setInterval(async () => {
      try {
        const response = await apiRef.current.getMessages(conversation.id);
        const newMessages = response.messages.filter(
          (msg) =>
            !messages.some((m) => m.id === msg.id) &&
            (msg.sender_type === 'AGENT' || msg.sender_type === 'BOT')
        );

        if (newMessages.length > 0) {
          setMessages((prev) => [...prev, ...newMessages]);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000);
  }, [conversation, messages, isPolling]);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
      setIsPolling(false);
    }
  }, []);

  const endConversation = useCallback(async () => {
    if (!conversation || !sessionToken) return;

    try {
      await apiRef.current.endConversation(conversation.id, sessionToken);
      setConversation(null);
      setSessionToken(null);
      setMessages([]);
      stopPolling();
      localStorage.removeItem(`cali_chat_${botId}`);
    } catch (error: any) {
      onError?.(error);
      throw error;
    }
  }, [conversation, sessionToken, botId, stopPolling, onError]);

  return {
    conversation,
    sessionToken,
    messages,
    isConnecting,
    isPolling,
    startConversation,
    sendMessage,
    startPolling,
    stopPolling,
    endConversation,
  };
}