"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useOptimistic,
  useTransition,
  useMemo,
} from "react";
import { X, Send } from "lucide-react";
import type { Conversation, VisitorInfo, BotConfiguration } from "@/types";
import { cn } from "../utils/cn";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import { Avatar } from "./ui/Avatar";
import { Button } from "./ui/Button";
import { useChat } from "../hooks/useChat";
import { ConversationalQuestion } from "./ConversationalQuestion";
import {
  type ThemeConfig,
  applyThemeToElement,
  extractThemeFromBot,
  DEFAULT_THEME,
} from "../utils/theme-manager";
import { SessionManager } from "../utils/session";
import socketService from "@/Widget/services/socketService";
import { logger } from "../utils/logger";
// import "../theme-variables.css"

import "../globals.css";

type BubbleMessage = {
  id: string;
  type: "bot" | "user" | "action-buttons" | "agent" | "conversational-question";
  content: string;
  timestamp: string;
  actions?: Array<{ label: string; onClick: () => void }>;
  question?: string;
  options?: string[];
  currentRank?: number;
  isPending?: boolean;
  agentName?: string;
};

type ChatStep =
  | "welcome"
  | "asking-name"
  | "asking-email"
  | "asking-phone"
  | "chatting";

interface ChatInterfaceProps {
  botName: string;
  welcomeMessage?: string;
  avatarSrc?: string;
  apiBaseUrl: string;
  botId: string;
  onClose: () => void;
  botConfig?: BotConfiguration;
  featureChat?: any;
  featureUI?: any;
}

const UserMessage = React.memo<{ content: string; isPending?: boolean }>(
  ({ content, isPending }) => (
    <div className="flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div
        className={cn(
          "max-w-[80%] bg-theme-primary text-theme-primary-content px-4 py-3 rounded-theme-bubble rounded-br-md shadow-lg",
          isPending && "opacity-60 animate-pulse"
        )}
      >
        <p className="text-sm font-medium leading-relaxed">{content}</p>
      </div>
    </div>
  )
);
UserMessage.displayName = "UserMessage";

const BotMessage = React.memo<{
  content: string;
  avatarSrc?: string;
  botName: string;
}>(({ content, avatarSrc, botName }) => (
  <div className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
    <Avatar
      src={avatarSrc}
      fallback={botName}
      size="sm"
      className="shrink-0 mt-1"
    />
    <div className="max-w-[85%] bg-theme-base-100 px-4 py-3 rounded-theme-bubble rounded-bl-md shadow-md border border-theme-base">
      <p className="text-sm text-theme-base-content whitespace-pre-wrap leading-relaxed">
        {content}
      </p>
    </div>
  </div>
));
BotMessage.displayName = "BotMessage";

const AgentMessage = React.memo<{ content: string; agentName?: string; timestamp?: string }>(
  ({ content, agentName, timestamp }) => {
    const formatTime = (dateString?: string) => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });
      } catch {
        return '';
      }
    };

    return (
      <div className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="w-8 h-8 rounded-full bg-theme-accent text-theme-primary-content flex items-center justify-center text-xs font-bold ring-2 ring-theme-base-100 shadow-md">
          {agentName?.charAt(0) || "A"}
        </div>
        <div className="max-w-[85%] bg-theme-base-100 px-4 py-3 rounded-theme-bubble rounded-bl-md shadow-md border border-theme-accent">
          <p className="text-xs font-semibold text-theme-accent mb-1">
            {agentName || "Support Agent"}
          </p>
          <p className="text-sm text-theme-base-content whitespace-pre-wrap leading-relaxed">
            {content}
          </p>
          {timestamp && (
            <p className="text-xs text-theme-neutral mt-1 opacity-70">
              {formatTime(timestamp)}
            </p>
          )}
        </div>
      </div>
    );
  }
);
AgentMessage.displayName = "AgentMessage";

const ActionButtons = React.memo<{
  actions: Array<{ label: string; onClick: () => void }>;
  avatarSrc?: string;
}>(({ actions, avatarSrc }) => (
  <div className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
    {avatarSrc && <div className="w-8 shrink-0" />}
    <div className="flex flex-wrap gap-2.5">
      {actions.map((action, idx) => (
        <Button
          key={idx}
          variant="outline"
          size="sm"
          onClick={action.onClick}
          className="rounded-full px-4 py-2 transition-all duration-200 hover:opacity-80 bg-theme-base-200 border border-theme-base text-theme-base-content"
        >
          {action.label}
        </Button>
      ))}
    </div>
  </div>
));
ActionButtons.displayName = "ActionButtons";

const TypingIndicator = React.memo<{ avatarSrc?: string; botName: string }>(
  ({ avatarSrc, botName }) => (
    <div className="flex items-start gap-3 widget-fade-in animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Avatar
        src={avatarSrc}
        fallback={botName}
        size="sm"
        className="shrink-0"
      />
      <div className="bg-theme-base-100 px-4 py-3 rounded-theme-bubble rounded-bl-md shadow-md border border-theme-base">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-theme-neutral rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 bg-theme-neutral rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 bg-theme-neutral rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  )
);
TypingIndicator.displayName = "TypingIndicator";

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  botName,
  welcomeMessage,
  avatarSrc,
  apiBaseUrl,
  botId,
  onClose,
  botConfig,
  featureChat,
  featureUI,
}) => {
  // ✅ USE THE HOOK - Creates session automatically on mount
  const {
    currentQuestion: hookQuestion,
    isLoading: isHookLoading,
    conversationEnded,
    sessionInitialized,
    startChat,
    sendMessage: sendHookMessage,
    resetChat,
    setCurrentQuestion: setHookQuestion, // For state restoration
  } = useChat({
    botId,
    apiBaseUrl,
    onError: (error) => {
      console.error("Chat error:", error);
      addBotMessage("Sorry, something went wrong. Please try again.", "bot");
    },
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<BubbleMessage[]>([]);
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (state, newMessage: BubbleMessage) => [
      ...state,
      { ...newMessage, isPending: true },
    ]
  );

  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentStep, setCurrentStep] = useState<ChatStep>("welcome");
  const [visitorInfo, setVisitorInfo] = useState<Partial<VisitorInfo>>({});
  const [validationError, setValidationError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null); // ✅ Keep this - used for LIVE CHAT
  // const [currentQuestion, setCurrentQuestion] = useState<any>(null); // ❌ Remove - use hookQuestion instead
  const scrollRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<Set<number>>(new Set());
  const abortControllerRef = useRef<AbortController | null>(null);
  const initialChatDataRef = useRef<any>(null);
  const stateRestoredRef = useRef(false);
  const initializedRef = useRef(false);
  const [isPending, startTransition] = useTransition();
  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME);
  const [chatMode, setChatMode] = useState<'faq' | 'live-chat'>('faq');
  const [activeChatSessionId, setActiveChatSessionId] = useState<string | null>(null);
  const [socketConnecting, setSocketConnecting] = useState(false);

  const formConfig = useMemo(
    () =>
      botConfig?.feature_forms || {
        requireName: true,
        requireEmail: true,
        requirePhone: false,
        gdprConsent: false,
        privacyPolicyUrl: null,
        collectInfoTiming: "on-demand" as const,
      },
    [botConfig]
  );

  const validateEmail = useCallback((email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  const genId = useCallback(
    () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    []
  );

  // Restore chat state from sessionStorage on mount
  useEffect(() => {
    try {
      const savedState = sessionStorage.getItem(`cali_chat_state_${botId}`);
      if (savedState) {
        const state = JSON.parse(savedState);

        // Only restore if we have actual messages (not empty state)
        if (state.messages && state.messages.length > 0) {
          logger.log("📂 Restoring chat state from sessionStorage:", state);

          // Mark that we restored state - MUST be before setting initializedRef
          stateRestoredRef.current = true;
          initializedRef.current = true; // Prevent re-initialization

          // Restore all state
          setMessages(state.messages);
          if (state.currentStep) setCurrentStep(state.currentStep);
          if (state.visitorInfo) setVisitorInfo(state.visitorInfo);
          if (state.conversation) setConversation(state.conversation);
          if (state.sessionToken) setSessionToken(state.sessionToken);
          // Restore the current question if it was saved
          if (state.currentQuestion) {
            setHookQuestion(state.currentQuestion);
          }
          // Restore chat mode (faq vs live-chat)
          if (state.chatMode) {
            setChatMode(state.chatMode);
          }
          if (state.initialChatData)
            initialChatDataRef.current = state.initialChatData;
          
          logger.log("✅ Chat state restored successfully");
        } else {
          logger.log("🗑️ Clearing empty sessionStorage state");
          sessionStorage.removeItem(`cali_chat_state_${botId}`);
        }
      }
    } catch (error) {
      console.error("Failed to restore chat state:", error);
    }
  }, [botId, setHookQuestion]);

  // Save chat state to sessionStorage whenever it changes
  useEffect(() => {
    // Don't save if there are no messages yet (prevents saving empty state)
    if (messages.length === 0) return;
    
    try {
      const stateToSave = {
        messages,
        currentStep,
        visitorInfo,
        conversation,
        sessionToken,
        currentQuestion: hookQuestion, // Save current question for restoration
        initialChatData: initialChatDataRef.current,
        chatMode, // Save chat mode (faq vs live-chat)
      };
      sessionStorage.setItem(
        `cali_chat_state_${botId}`,
        JSON.stringify(stateToSave)
      );
      logger.log("💾 Chat state saved", { messageCount: messages.length, currentStep, hasQuestion: !!hookQuestion });
    } catch (error) {
      console.error("Failed to save chat state:", error);
    }
  }, [messages, currentStep, visitorInfo, conversation, sessionToken, botId, hookQuestion, chatMode]);

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
      abortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [optimisticMessages, scrollToBottom]);

  const setManagedTimeout = useCallback((callback: () => void, delay: number) => {
    const id = window.setTimeout(() => {
      timersRef.current.delete(id);
      callback();
    }, delay);
    timersRef.current.add(id);
    return id;
  }, []);

  const clearManagedTimeout = useCallback((id: number) => {
    window.clearTimeout(id);
    timersRef.current.delete(id);
  }, []);

  // Ensure cleanup on unmount
  useEffect(() => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    return () => {
      // Clear all timers
      timersRef.current.forEach(id => window.clearTimeout(id));
      timersRef.current.clear();
      
      // Abort pending requests
      controller.abort();
      
      // Disconnect socket if connected
      socketService.disconnect();
    };
  }, []);

  const addBotMessage = useCallback(
    (
      content: string,
      type: BubbleMessage["type"] = "bot",
      extraData?: Partial<BubbleMessage>
    ) => {
      const msg: BubbleMessage = {
        id: genId(),
        type,
        content,
        timestamp: new Date().toISOString(),
        ...extraData,
      };
      setMessages((prev) => [...prev, msg]);
    },
    [genId]
  );

  const addUserMessage = useCallback(
    (content: string) => {
      const msg: BubbleMessage = {
        id: genId(),
        type: "user",
        content,
        timestamp: new Date().toISOString(),
      };

      addOptimisticMessage(msg);

      startTransition(() => {
        setMessages((prev) => [...prev, msg]);
      });
    },
    [genId, addOptimisticMessage]
  );

  // Define handleCreateConversation early since it's used by multiple handlers
  const handleCreateConversation = useCallback(
    async (fullVisitorInfo: VisitorInfo) => {
      setIsTyping(true);
      setSocketConnecting(true);

      try {
        const faqSession = SessionManager.get();
        logger.log('🔍 FAQ Session from SessionManager:', faqSession);
        
        if (!faqSession) {
          throw new Error("No active session found. Please refresh and try again.");
        }
        
        if (!faqSession.sessionId) {
          throw new Error("Session ID is missing. Current session: " + JSON.stringify(faqSession));
        }
        
        if (!faqSession.sessionToken) {
          throw new Error("Session token is missing. Current session: " + JSON.stringify(faqSession));
        }

        // 🔑 Always use 'dev-tenant' for development (matches AgentDashboard)
        // This ensures automatic synchronization between widget escalation and agent dashboard
        const effectiveTenantId = 'dev-tenant';
        
        logger.log('📤 Escalating with data:', {
          sessionId: faqSession.sessionId,
          sessionToken: faqSession.sessionToken,
          visitorName: fullVisitorInfo.name,
          visitorEmail: fullVisitorInfo.email,
          botId,
          tenantId: effectiveTenantId,
          environment: process.env.NODE_ENV
        });

        // Build URL with botId and tenantId as query params
        const escalateUrl = new URL(
          `${apiBaseUrl}/api/widget/${faqSession.sessionId}/escalate-to-agent`
        );
        escalateUrl.searchParams.append('botId', botId);
        escalateUrl.searchParams.append('tenantId', effectiveTenantId);

        logger.log('🔗 Escalate URL:', escalateUrl.toString());

        const response = await fetch(escalateUrl.toString(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_token: faqSession.sessionToken,
            visitor_name: fullVisitorInfo.name,
            visitor_email: fullVisitorInfo.email,
            visitor_phone: fullVisitorInfo.phone,
          }),
        });

        logger.log('📨 Escalate response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('❌ Escalate error response:', errorData);
          throw new Error(errorData.message || `HTTP ${response.status}: Failed to connect to agent`);
        }

        const data = await response.json();
        logger.log('✅ Escalation response:', data);

        // 🔌 Connect socket with dynamic apiBaseUrl
        try {
          logger.log('🔌 Connecting socket to:', apiBaseUrl);
          await socketService.connect(apiBaseUrl); // ✅ Pass apiBaseUrl here
          logger.log('✅ Socket connected successfully');
          
          // 🔗 Join the session room
          logger.log('🔗 Joining session room...');
          socketService.joinSessionRoom(faqSession.sessionId, faqSession.sessionToken);
          logger.log('✅ Joined session room');
        } catch (err) {
          console.error('Socket connection failed:', err);
          throw new Error('Unable to connect to live chat server.');
        }

        // ✅ Extract just the message text (avoid displaying full JSON)
        const messageText = typeof data === 'object' && data.message 
          ? data.message 
          : data || "Connecting you to an agent. Please wait...";

        startTransition(() => {
          // Keep same conversation ID (it's now a live chat session)
          setConversation({ id: faqSession.sessionId } as any);
          setSessionToken(faqSession.sessionToken);
          setVisitorInfo(fullVisitorInfo);
          setActiveChatSessionId(faqSession.sessionId); // ✅ Store session ID for socket
          setChatMode('live-chat'); // ✅ SWITCH TO LIVE CHAT MODE
          setCurrentStep("chatting");
          addBotMessage(messageText, "bot");
        });

        // ✅ Clear loading states immediately after escalation
        setIsTyping(false);
        setSocketConnecting(false);
      } catch (error: any) {
        console.error("❌ Failed to escalate to live chat:", error.message || error);
        setIsTyping(false);
        setSocketConnecting(false);
        addBotMessage(
          `Sorry, couldn't connect to an agent. ${error.message || "Please try again."}`,
          "bot"
        );
      }
    },
    [apiBaseUrl, botId, addBotMessage]
  );

  // Helper to start collecting visitor information
  const startInfoCollection = useCallback(() => {
    // Check GDPR consent as master switch
    if (!formConfig.gdprConsent) {
      // GDPR consent is false - skip all data collection and start chat anonymously
      handleCreateConversation({
        name: "Anonymous",
        email: "no-email@example.com",
      });
      return;
    }

    // GDPR consent is true - collect data based on requireX settings
    if (formConfig.requireName) {
      setCurrentStep("asking-name");
      setIsTyping(true);

      setManagedTimeout(() => {
        setIsTyping(false);
        addBotMessage("To get started, what's your name?", "bot");
      }, 600);
    } else if (formConfig.requireEmail) {
      setCurrentStep("asking-email");
      setIsTyping(true);

      setManagedTimeout(() => {
        setIsTyping(false);
        addBotMessage("To get started, what's your email address?", "bot");
      }, 600);
    } else if (formConfig.requirePhone) {
      setCurrentStep("asking-phone");
      setIsTyping(true);

      setManagedTimeout(() => {
        setIsTyping(false);
        addBotMessage("To get started, what's your phone number?", "bot");
      }, 600);
    } else {
      // GDPR is true but no fields required
      // For upfront: just store anonymous and continue to welcome
      // For on-demand: create conversation
      if (formConfig.collectInfoTiming === "on-demand") {
        handleCreateConversation({
          name: "Anonymous",
          email: "no-email@example.com",
        });
      }
    }
  }, [formConfig, setManagedTimeout, addBotMessage, handleCreateConversation]);

  const handleContactSupport = useCallback(() => {
    addUserMessage("I want to contact support");

    // Check if we already have visitor info collected (upfront mode)
    if (visitorInfo.name && formConfig.collectInfoTiming === "upfront") {
      // Info already collected, create conversation directly
      const fullInfo: VisitorInfo = {
        name: visitorInfo.name,
        email: visitorInfo.email || "no-email@example.com",
      };
      if (visitorInfo.phone) {
        fullInfo.phone = visitorInfo.phone;
      }
      handleCreateConversation(fullInfo);
    } else {
      // Info not collected yet or on-demand mode, start collection
      startInfoCollection();
    }
  }, [
    addUserMessage,
    visitorInfo,
    formConfig,
    startInfoCollection,
    handleCreateConversation,
  ]);

  const handleRestart = useCallback(async () => {
    // Clear restored state flag to allow fresh initialization
    stateRestoredRef.current = false;
    initializedRef.current = false;
    
    // Clear saved state
    sessionStorage.removeItem(`cali_chat_state_${botId}`);
    
    // Reset hook and UI state
    resetChat();
    setMessages([]);
    setCurrentStep("welcome");
  }, [resetChat, botId]);

  const handleOptionSelect = useCallback(
    async (option: string) => {
      if (!hookQuestion) return; // ✅ Use hook's question

      addUserMessage(option);

      try {
        const result = await sendHookMessage(option); // ✅ Hook's sendMessage includes session

        if (result.acknowledged) {
          addBotMessage(result.acknowledged, "bot");
        }

        // ✅ HANDLE END OF CONVERSATION
        if (result.ended) {
          setManagedTimeout(() => {
            addBotMessage(
              result.endMessage || "Thank you for chatting with us!",
              "bot"
            );

            // Show action buttons: Contact Support or Start Over
            setManagedTimeout(() => {
              addBotMessage("", "action-buttons", {
                actions: [
                  {
                    label: "💬 Connect to Specialist",
                    onClick: handleContactSupport,
                  },
                  {
                    label: "🔄 Start Over",
                    onClick: handleRestart, // Use the proper restart handler
                  },
                ],
              });
            }, 800);
          }, 400);
          return; // Exit early - conversation ended
        }

        // Continue with next question if available
        if (result.nextQuestion) {
          setManagedTimeout(() => {
            addBotMessage("", "conversational-question", {
              question: result.nextQuestion!.question,
              options: result.nextQuestion!.options || [],
            });
          }, 400);
        }
      } catch (error) {
        addBotMessage("Sorry, something went wrong.", "bot");
      }
    },
    [
      hookQuestion,
      sendHookMessage,
      addUserMessage,
      addBotMessage,
      setManagedTimeout,
      handleContactSupport,
      handleRestart,
      resetChat,
    ]
  );

  useEffect(() => {
    const initializeChat = async () => {
      // Skip initialization if state was restored from storage
      if (stateRestoredRef.current) {
        logger.log("⏭️ Skipping initialization - state was restored from storage");
        return;
      }
      
      if (initializedRef.current || !sessionInitialized) return;
      initializedRef.current = true;

      try {
        logger.log("🚀 Starting conversational chat with session...");
        const data = await startChat(); // ✅ Hook's startChat includes session credentials

        if (!data) return;

        const welcomeMsg: BubbleMessage = {
          id: genId(),
          type: "bot",
          content: data.greeting || welcomeMessage || `Hi! I'm ${botName}`,
          timestamp: new Date().toISOString(),
        };

        setMessages([welcomeMsg]);

        if (data.has_questions && data.next_question) {
          setManagedTimeout(() => {
            addBotMessage("", "conversational-question", {
              question: data.next_question!.question,
              options: data.next_question!.options || [],
            });
          }, 400);
        }
      } catch (error) {
        console.error("Failed to initialize:", error);
      }
    };

    initializeChat();
  }, [sessionInitialized, startChat]); // ✅ Wait for session before starting

  const handleNameSubmit = useCallback(() => {
    if (!inputText.trim()) {
      setValidationError("Name is required");
      return;
    }

    const name = inputText.trim();

    startTransition(() => {
      setVisitorInfo((prev) => ({ ...prev, name }));
      addUserMessage(name);
      setInputText("");
      setValidationError(null);

      // Determine next step based on config
      if (formConfig.requireEmail) {
        setCurrentStep("asking-email");
        setIsTyping(true);

        setManagedTimeout(() => {
          setIsTyping(false);
          addBotMessage(
            `Nice to meet you, ${name}! What's your email address?`,
            "bot"
          );
        }, 600);
      } else if (formConfig.requirePhone) {
        setCurrentStep("asking-phone");
        setIsTyping(true);

        setManagedTimeout(() => {
          setIsTyping(false);
          addBotMessage(
            `Nice to meet you, ${name}! What's your phone number?`,
            "bot"
          );
        }, 600);
      } else {
        // No more fields to collect
        if (formConfig.collectInfoTiming === "upfront") {
          // Just return to welcome - the FAQ hook will handle showing questions
          setCurrentStep("welcome");
          setIsTyping(true);
          setManagedTimeout(() => {
            setIsTyping(false);
            addBotMessage("Great! How can I help you today?", "bot");
          }, 600);
        } else {
          // On-demand: create conversation immediately
          handleCreateConversation({ name, email: "no-email@example.com" });
        }
      }
    });
  }, [
    inputText,
    addUserMessage,
    setManagedTimeout,
    addBotMessage,
    formConfig,
    handleCreateConversation,
    genId,
    handleContactSupport,
  ]);

  const handleEmailSubmit = useCallback(() => {
    if (!inputText.trim()) {
      setValidationError("Email is required");
      return;
    }

    const email = inputText.trim();

    if (!validateEmail(email)) {
      setValidationError("Please enter a valid email address");
      return;
    }

    startTransition(() => {
      setVisitorInfo((prev) => ({ ...prev, email }));
      addUserMessage(email);
      setInputText("");
      setValidationError(null);

      // Determine next step
      if (formConfig.requirePhone) {
        setCurrentStep("asking-phone");
        setIsTyping(true);

        setManagedTimeout(() => {
          setIsTyping(false);
          addBotMessage("Great! And what's your phone number?", "bot");
        }, 600);
      } else {
        // No more fields to collect
        if (formConfig.collectInfoTiming === "upfront") {
          setCurrentStep("welcome");
          setIsTyping(true);
          setManagedTimeout(() => {
            setIsTyping(false);
            addBotMessage("Perfect! How can I help you today?", "bot");
          }, 600);
        } else {
          // On-demand: create conversation with name and email
          handleCreateConversation({ name: visitorInfo.name!, email: email });
        }
      }
    });
  }, [
    inputText,
    visitorInfo.name,
    addUserMessage,
    setManagedTimeout,
    addBotMessage,
    formConfig,
    validateEmail,
    handleCreateConversation,
    genId,
    handleContactSupport,
  ]);

  const handlePhoneSubmit = useCallback(() => {
    if (!inputText.trim()) {
      setValidationError("Phone number is required");
      return;
    }

    const phone = inputText.trim();

    startTransition(() => {
      setVisitorInfo((prev) => ({ ...prev, phone }));
      addUserMessage(phone);
      setInputText("");
      setValidationError(null);

      if (formConfig.collectInfoTiming === "upfront") {
        setCurrentStep("welcome");
        setIsTyping(true);
        setManagedTimeout(() => {
          setIsTyping(false);
          addBotMessage("All set! How can I assist you today?", "bot");
        }, 600);
      } else {
        // On-demand: create conversation with all collected info
        const fullInfo: VisitorInfo = {
          name: visitorInfo.name!,
          email: visitorInfo.email || "no-email@example.com",
          phone: phone,
        };
        handleCreateConversation(fullInfo);
      }
    });
  }, [
    inputText,
    visitorInfo,
    addUserMessage,
    setManagedTimeout,
    addBotMessage,
    formConfig,
    handleCreateConversation,
    genId,
    handleContactSupport,
  ]);

  const handleChatMessage = useCallback(async () => {
    if (!inputText.trim() || isTyping || !conversation || !sessionToken) return;

    const userMsg = inputText.trim();
    setInputText("");

    const optimisticMsg: BubbleMessage = {
      id: genId(),
      type: "user",
      content: userMsg,
      timestamp: new Date().toISOString(),
      isPending: true,
    };

    startTransition(() => setMessages((prev) => [...prev, optimisticMsg]));
    setIsTyping(true);

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    try {
      if (chatMode === 'live-chat') {
        // ✅ Send via socket.io (real-time, like PlaygroundPage)
        if (!activeChatSessionId) {
          throw new Error('No active chat session');
        }
        logger.log(`📤 Sending live chat message via socket: ${activeChatSessionId}`);
        await socketService.sendMessage(activeChatSessionId, userMsg);
        
        // ✅ Mark message as sent (not pending)
        startTransition(() => {
          setMessages((prev) =>
            prev.map((m) => (m.id === optimisticMsg.id ? { ...m, isPending: false } : m))
          );
        });
      } else {
        // FAQ mode - HTTP
        logger.log(`📤 Sending FAQ message to conversation: ${conversation.id}`);
        const response = await fetch(
          `${apiBaseUrl}/api/conversations/${conversation.id}/messages`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${sessionToken}`,
            },
            signal: abortControllerRef.current.signal,
            body: JSON.stringify({
              content: { text: userMsg },
              sender_type: "USER",
            }),
          }
        );

        if (!response.ok) {
          console.error('Send message failed:', response.status);
          throw new Error("Failed to send message");
        }

        const data = await response.json();
        logger.log('✅ Message sent:', data);

        startTransition(() => {
          setMessages((prev) =>
            prev.map((m) => (m.id === optimisticMsg.id ? { ...m, isPending: false } : m))
          );
          if (data.botResponse) {
            addBotMessage(data.botResponse.content.text, "bot");
          }
        });
      }

      setIsTyping(false);
    } catch (error: any) {
      if (error.name === "AbortError") return;
      
      console.error('Send message error:', error);
      
      startTransition(() => {
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticMsg.id ? { ...m, isPending: false } : m))
        );
        addBotMessage("Sorry, something went wrong. Please try again.", "bot");
      });
      setIsTyping(false);
    }
  }, [inputText, isTyping, conversation, sessionToken, apiBaseUrl, addBotMessage, chatMode, activeChatSessionId]);

  // 🚀 Set up socket listeners for live chat (like PlaygroundPage)
  useEffect(() => {
    if (chatMode !== 'live-chat' || !activeChatSessionId) return;

    logger.log('📡 Setting up socket listeners for live chat');

    // Listen for agent assignment
    const unsubscribeAgent = socketService.onAgentAssigned(() => {
      logger.log('👤 Agent assigned');
      addBotMessage("An agent has joined the chat. They can assist you now!", "bot");
    });

    // Listen for new messages from agent
    const unsubscribeMessage = socketService.onNewMessage((data: any) => {
      logger.log('💬 New message received:', data);
      if (data.sender_type === "AGENT") {
        // ✅ Update messages immediately without transition for real-time feel
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === data.id)) return prev;
          return [
            ...prev,
            {
              id: data.id || genId(),
              type: "agent",
              content: data.content,
              timestamp: data.created_at,
              agentName: data.sender_name,
            },
          ];
        });
      }
    });

    // Listen for session closure
    const unsubscribeClose = socketService.onSessionClosed(() => {
      logger.log('🔌 Chat session closed');
      addBotMessage("Chat session has ended. Thank you for contacting us!", "bot");
      setActiveChatSessionId(null);
      setChatMode('faq');
    });

    // Cleanup
    return () => {
      if (typeof unsubscribeAgent === 'function') unsubscribeAgent();
      if (typeof unsubscribeMessage === 'function') unsubscribeMessage();
      if (typeof unsubscribeClose === 'function') unsubscribeClose();
    };
  }, [chatMode, activeChatSessionId]);

  // Poll FAQ mode messages (if not using live chat)
  useEffect(() => {
    if (currentStep !== "chatting" || !conversation || chatMode === 'live-chat') return;

    const pollInterval = setInterval(async () => {
      try {
        // FAQ mode polling only
        const response = await fetch(
          `${apiBaseUrl}/api/conversations/${conversation.id}/messages`
        );

        if (!response.ok) return;

        const data = await response.json();
        const messagesData = data.messages || [];

        startTransition(() => {
          setMessages((prev: any) => {
            const existingIds = new Set(prev.map((m) => m.id));
            
            const newMessages = messagesData.filter((m: any) => {
              if (existingIds.has(m.id)) return false;
              return m.sender_type === 'BOT';
            });

            if (newMessages.length === 0) return prev;

            const newBubbles = newMessages.map((m: any) => ({
              id: m.id,
              type: 'bot',
              content: m.content?.text || m.content || '',
              timestamp: m.created_at,
            }));

            logger.log('✅ Added new FAQ messages:', newBubbles.length);
            return [...prev, ...newBubbles];
          });
        });
      } catch (error) {
        console.error("FAQ polling error:", error);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [currentStep, conversation, apiBaseUrl, chatMode]);

  const handleSendMessage = useCallback(() => {
    switch (currentStep) {
      case "asking-name":
        handleNameSubmit();
        break;
      case "asking-email":
        handleEmailSubmit();
        break;
      case "asking-phone":
        handlePhoneSubmit();
        break;
      case "chatting":
        handleChatMessage();
        break;
    }
  }, [
    currentStep,
    handleNameSubmit,
    handleEmailSubmit,
    handlePhoneSubmit,
    handleChatMessage,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    if (botConfig) {
      const extractedTheme = extractThemeFromBot(botConfig);
      logger.log('[ChatInterface] Extracted theme layout:', extractedTheme.layout);
      logger.log('[ChatInterface] Extracted theme typography:', extractedTheme.typography);
      logger.log('[ChatInterface] BotConfig theme_typography:', botConfig.theme_typography);
      setTheme(extractedTheme);

      if (containerRef.current) {
        logger.log('[ChatInterface] Applying theme to container');
        applyThemeToElement(
          containerRef.current,
          extractedTheme,
          featureUI?.darkMode
        );
      } else {
        logger.log('[ChatInterface] Container ref not ready yet');
      }
    }
  }, [botConfig, featureUI?.darkMode]);

  // Apply theme whenever theme changes and container is available
  // This also handles the initial mount case
  useEffect(() => {
    if (containerRef.current && theme !== DEFAULT_THEME) {
      logger.log('[ChatInterface] Applying theme to container:', theme.layout);
      applyThemeToElement(containerRef.current, theme, featureUI?.darkMode);
    }
  }, [theme, featureUI?.darkMode]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "cali-chat-widget w-[380px] h-[600px] rounded-theme bg-theme-base-100 shadow-2xl flex flex-col overflow-hidden border border-theme-base-300",
        featureUI?.darkMode && "dark"
      )}
      style={{
        fontFamily: theme.typography.fontFamily as string,
        fontSize: theme.typography.fontSize as string,
        // Apply theme CSS variables directly via inline style for immediate availability
        // This ensures colors work on first render before useEffect runs
        '--theme-primary': theme.colors.primary,
        '--theme-primary-content': theme.colors.primaryContent,
        '--theme-secondary': theme.colors.secondary,
        '--theme-secondary-content': theme.colors.secondaryContent,
        '--theme-accent': theme.colors.accent,
        '--theme-accent-content': theme.colors.accentContent,
        '--theme-base-100': theme.colors.base100,
        '--theme-base-200': theme.colors.base200,
        '--theme-base-300': theme.colors.base300,
        '--theme-base-content': theme.colors.baseContent,
        '--theme-neutral': theme.colors.neutral,
        '--theme-neutral-content': theme.colors.neutralContent,
        '--theme-success': theme.colors.success,
        '--theme-border-radius': theme.layout.borderRadius,
        '--theme-button-radius': theme.layout.buttonRadius,
        '--theme-input-radius': theme.layout.inputRadius,
        '--theme-avatar-radius': theme.layout.avatarRadius,
        '--theme-bubble-radius': theme.layout.bubbleRadius,
        '--theme-font-size': theme.typography.fontSize,
        '--theme-font-family': theme.typography.fontFamily,
        borderRadius: theme.layout.borderRadius || '24px',
      } as React.CSSProperties}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-theme-base bg-theme-primary">
        <div className="flex items-center gap-3">
          <Avatar src={avatarSrc} fallback={botName} size="md" />
          <div>
            <h2 className="font-semibold text-theme-primary-content">
              {botName}
            </h2>
            {isTyping && (
              <p className="text-xs text-theme-primary-content opacity-80">
                typing...
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          aria-label="Close chat"
        >
          <X className="w-5 h-5 text-theme-primary-content" />
        </button>
      </div>

      {/* Messages Container */}
      <ScrollArea.Root className="flex-1 overflow-hidden">
        <ScrollArea.Viewport className="w-full h-full">
          <div className="flex flex-col gap-4 p-4">
            {optimisticMessages.map((msg) => {
              switch (msg.type) {
                case "user":
                  return (
                    <UserMessage
                      key={msg.id}
                      content={msg.content}
                      isPending={msg.isPending}
                    />
                  );
                case "bot":
                  return (
                    <BotMessage
                      key={msg.id}
                      content={msg.content}
                      avatarSrc={avatarSrc}
                      botName={botName}
                    />
                  );
                case "action-buttons":
                  return (
                    <ActionButtons
                      key={msg.id}
                      actions={msg.actions || []}
                      avatarSrc={avatarSrc}
                    />
                  );
                case "agent":
                  return (
                    <AgentMessage
                      key={msg.id}
                      content={msg.content}
                      agentName={msg.agentName}
                      timestamp={msg.timestamp}
                    />
                  );
                case "conversational-question":
                  return (
                    <ConversationalQuestion
                      key={msg.id}
                      question={msg.question || ""}
                      options={msg.options || []}
                      avatarSrc={avatarSrc}
                      botName={botName}
                      onSelectOption={handleOptionSelect}
                    />
                  );
                default:
                  return null;
              }
            })}
            {isTyping && featureChat?.showTypingIndicator !== false && (
              <TypingIndicator avatarSrc={avatarSrc} botName={botName} />
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar orientation="vertical" className="w-2" />
      </ScrollArea.Root>

      {/* Input Area - Only show when user input is needed */}
      {currentStep !== "welcome" && (
        <div className="border-t border-theme-base bg-theme-base-100 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                if (validationError) setValidationError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder={
                currentStep === "asking-name"
                  ? "Enter your name..."
                  : currentStep === "asking-email"
                  ? "Enter your email..."
                  : currentStep === "asking-phone"
                  ? "Enter your phone number..."
                  : "Type your message..."
              }
              className="flex-1 px-4 py-2 rounded-theme-input bg-theme-base-200 border border-theme-base focus:outline-none focus:ring-2 focus:ring-theme-primary text-theme-base-content placeholder:text-theme-neutral disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isTyping || isPending}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isTyping || isPending}
              className="px-4 py-2"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          {validationError && (
            <p className="text-xs text-error mt-2">{validationError}</p>
          )}
        </div>
      )}
    </div>
  );
};
