import { useState, useCallback, useRef, useEffect } from "react";
import { WidgetApi } from "../utils/api";
import { SessionManager } from "../utils/session";

interface ChatQuestion {
  id: string;
  question: string;
  options: string[] | null;
}

interface UseChatOptions {
  botId: string;
  apiBaseUrl: string;
  onError?: (error: Error) => void;
}

export function useChat({ botId, apiBaseUrl, onError }: UseChatOptions) {
  const [currentQuestion, setCurrentQuestion] = useState<ChatQuestion | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [conversationEnded, setConversationEnded] = useState(false);
  const [sessionInitialized, setSessionInitialized] = useState(false);

  const apiRef = useRef(new WidgetApi(apiBaseUrl));
  const abortControllerRef = useRef<AbortController | null>(null);

  const initializingRef = useRef(false); // Add this to prevent double init

  // Initialize session on mount
  useEffect(() => {
    // Prevent double initialization in StrictMode
    if (initializingRef.current) return;
    initializingRef.current = true;
    
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    initializeSession(controller.signal);

    return () => {
      controller.abort();
      initializingRef.current = false;
      // Clear any timers
    };
  }, [botId]);

  const initializeSession = async (signal?: AbortSignal) => {
    try {
      setIsLoading(true);

      const existingSession = SessionManager.get();

      const response = await apiRef.current.initSession(
        botId,
        existingSession?.sessionToken,
        existingSession?.visitorId,
        undefined,
        signal // Pass abort signal
      );

      // Check if aborted
      if (signal?.aborted) return;

      // Save session
      SessionManager.set({
        sessionId: response.session_id,
        sessionToken: response.session_token,
        botId: botId,
        visitorId: response.visitor_id,
        status: response.status as any,
        createdAt: new Date().toISOString(),
      });

      setSessionInitialized(true);
      console.log(
        `✅ Session ${response.resumed ? "resumed" : "created"}:`,
        response.session_id
      );
    } catch (error) {
      if ((error as Error).name === 'AbortError') return;
      onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const startChat = useCallback(async () => {
    if (!sessionInitialized) {
      await initializeSession();
    }

    const session = SessionManager.get();
    if (!session) {
      throw new Error("No active session");
    }

    setIsLoading(true);

    try {
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      const response = await apiRef.current.startChat(
        botId,
        session.sessionId,
        session.sessionToken,
        abortControllerRef.current.signal
      );

      if (response.has_questions && response.next_question) {
        setCurrentQuestion(response.next_question);
      }

      setIsLoading(false);
      return response;
    } catch (error: any) {
      if (error.name === "AbortError") return null;

      setIsLoading(false);
      onError?.(error);
      throw error;
    }
  }, [botId, sessionInitialized, onError]);

  const sendMessage = useCallback(
    async (
      selectedOption: string
    ): Promise<{
      acknowledged?: string;
      nextQuestion?: ChatQuestion | null;
      ended?: boolean;
      endMessage?: string;
      shouldTransferToHuman?: boolean;
    }> => {
      if (!currentQuestion) {
        throw new Error("No current question");
      }

      const session = SessionManager.get();
      if (!session) {
        throw new Error("No active session");
      }

      setIsLoading(true);

      try {
        abortControllerRef.current?.abort();
        abortControllerRef.current = new AbortController();

        const response = await apiRef.current.sendChatMessage(
          botId,
          selectedOption,
          currentQuestion.id,
          session.sessionId,
          session.sessionToken,
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
            shouldTransferToHuman: response.transfer_to_human, // ✅ ADD THIS
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

        // Handle error
        if (response.error) {
          setIsLoading(false);
          throw new Error(response.error);
        }

        return { acknowledged: response.acknowledged };
      } catch (error: any) {
        if (error.name === "AbortError") {
          return {};
        }

        setIsLoading(false);
        onError?.(error);
        throw error;
      }
    },
    [botId, currentQuestion, onError]
  );

  const resetChat = useCallback(() => {
    setCurrentQuestion(null);
    setConversationEnded(false);
    setIsLoading(false);
    SessionManager.clear();
    setSessionInitialized(false);
    initializeSession();
  }, []);

  return {
    currentQuestion,
    isLoading,
    conversationEnded,
    sessionInitialized,
    startChat,
    sendMessage,
    resetChat,
  };
}
