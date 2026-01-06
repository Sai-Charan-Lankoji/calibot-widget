import { useState, useCallback, useRef, useEffect } from 'react';
import { WidgetApi } from '../utils/api';

interface ChatQuestion {
  id: string;
  rank: number;
  question: string;
  options: string[] | null;
}

interface UseChatOptions {
  botId: string;
  apiBaseUrl: string;
  onError?: (error: Error) => void;
}

export function useChat({ botId, apiBaseUrl, onError }: UseChatOptions) {
  const [currentQuestion, setCurrentQuestion] = useState<ChatQuestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationEnded, setConversationEnded] = useState(false);
  
  const apiRef = useRef(new WidgetApi(apiBaseUrl));
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const startChat = useCallback(async () => {
    setIsLoading(true);
    
    try {
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      const response = await apiRef.current.startChat(
        botId,
        abortControllerRef.current.signal
      );

      if (response.has_questions && response.next_question) {
        setCurrentQuestion(response.next_question);
      }

      setIsLoading(false);
      return response;
    } catch (error: any) {
      if (error.name === 'AbortError') return null;
      
      setIsLoading(false);
      onError?.(error);
      throw error;
    }
  }, [botId, onError]);

  const sendMessage = useCallback(async (
    selectedOption: string
  ): Promise<{
    acknowledged?: string;
    nextQuestion?: ChatQuestion | null;
    ended?: boolean;
    endMessage?: string;
  }> => {
    if (!currentQuestion) {
      throw new Error('No current question');
    }

    setIsLoading(true);

    try {
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      const response = await apiRef.current.sendChatMessage(
        botId,
        selectedOption,
        currentQuestion.rank,
        abortControllerRef.current.signal
      );

      setIsLoading(false);

      // Handle end of conversation
      if (response.end) {
        setConversationEnded(true);
        setCurrentQuestion(null);
        return {
          acknowledged: response.acknowledged,
          ended: true,
          endMessage: response.message,
        };
      }

      // Handle next question
      if (response.next_question) {
        setCurrentQuestion(response.next_question);
        return {
          acknowledged: response.acknowledged,
          nextQuestion: response.next_question,
          ended: false,
        };
      }

      // Handle error (invalid option)
      if (response.error) {
        setIsLoading(false);
        throw new Error(response.error);
      }

      return { acknowledged: response.acknowledged };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return {};
      }
      
      setIsLoading(false);
      onError?.(error);
      throw error;
    }
  }, [botId, currentQuestion, onError]);

  const resetChat = useCallback(() => {
    setCurrentQuestion(null);
    setConversationEnded(false);
    setIsLoading(false);
  }, []);

  return {
    currentQuestion,
    isLoading,
    conversationEnded,
    startChat,
    sendMessage,
    resetChat,
  };
}