import React, { useState, useEffect, useRef, useCallback, useMemo, useOptimistic, useTransition, useEffectEvent, Activity } from "react";
import { X, Send } from "lucide-react";
import { FAQ, Conversation, VisitorInfo } from "@/types";
import { cn } from "../utils/cn";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import { Avatar } from "./ui/Avatar";
import { Button } from "./ui/Button";

type BubbleMessage = {
  id: string;
  type: 'bot' | 'user' | 'faq-list' | 'faq-answer' | 'action-buttons' | 'agent';
  content: string;
  timestamp: string;
  faqs?: FAQ[];
  actions?: Array<{ label: string; onClick: () => void }>;
  isPending?: boolean;
  agentName?: string;
};

type ChatStep = 'welcome' | 'showing-faqs' | 'showing-faq-detail' | 'asking-name' | 'asking-email' | 'chatting';

interface ChatInterfaceProps {
  botName: string;
  welcomeMessage?: string;
  avatarSrc?: string;
  faqs: FAQ[];
  apiBaseUrl: string;
  botId: string;
  onClose: () => void;
}

// Memoized message components
const UserMessage = React.memo<{ content: string; isPending?: boolean }>(({ content, isPending }) => (
  <div className="flex justify-end">
    <div className={cn(
      "max-w-[80%] bg-primary text-primary-content px-4 py-2.5 rounded-2xl rounded-br-md shadow-sm",
      isPending && "opacity-60 animate-pulse"
    )}>
      <p className="text-sm">{content}</p>
    </div>
  </div>
));
UserMessage.displayName = 'UserMessage';

const BotMessage = React.memo<{ content: string; avatarSrc?: string; botName: string }>(
  ({ content, avatarSrc, botName }) => (
    <div className="flex items-start gap-2">
      <Avatar src={avatarSrc} fallback={botName} size="sm" />
      <div className="max-w-[85%] bg-base-100 px-4 py-2.5 rounded-2xl rounded-bl-md shadow-sm border border-base">
        <p className="text-sm text-base-content whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  )
);
BotMessage.displayName = 'BotMessage';

const AgentMessage = React.memo<{ content: string; agentName?: string }>(
  ({ content, agentName }) => (
    <div className="flex items-start gap-2">
      <div className="w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center text-xs font-bold ring-2 ring-white shadow-sm">
        {agentName?.charAt(0) || 'A'}
      </div>
      <div className="max-w-[85%] bg-white px-4 py-2.5 rounded-2xl rounded-bl-md shadow-sm border border-primary/20">
        <p className="text-xs font-semibold text-primary mb-1">{agentName || 'Support Agent'}</p>
        <p className="text-sm text-base-content whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  )
);
AgentMessage.displayName = 'AgentMessage';

const FAQList = React.memo<{ 
  faqs: FAQ[]; 
  onSelect: (faq: FAQ) => void; 
  message: string;
  avatarSrc?: string;
}>(({ faqs, onSelect, message, avatarSrc }) => (
  <div className="flex items-start gap-2">
    {avatarSrc && <Avatar src={avatarSrc} fallback="B" size="sm" />}
    <div className="flex-1 space-y-2">
      <div className="bg-base-100 px-4 py-2.5 rounded-2xl rounded-bl-md shadow-sm border border-base max-w-[85%]">
        <p className="text-sm text-base-content">{message}</p>
      </div>
      <div className="space-y-1.5">
        {faqs.map((faq) => (
          <button
            key={faq.id}
            onClick={() => onSelect(faq)}
            className={cn(
              "w-full text-left px-3 py-2.5 rounded-lg text-sm",
              "bg-base-100 border border-base hover:border-primary/30",
              "hover:bg-base-200 transition-all",
              "focus:outline-none focus:ring-2 focus:ring-primary/20"
            )}
          >
            <span className="text-base-content font-medium">{faq.question}</span>
          </button>
        ))}
      </div>
    </div>
  </div>
));
FAQList.displayName = 'FAQList';

const ActionButtons = React.memo<{ 
  actions: Array<{ label: string; onClick: () => void }>;
  avatarSrc?: string;
}>(({ actions, avatarSrc }) => (
  <div className="flex items-start gap-2">
    {avatarSrc && <div className="w-7" />}
    <div className="flex flex-wrap gap-2">
      {actions.map((action, idx) => (
        <Button
          key={idx}
          variant="secondary"
          size="sm"
          onClick={action.onClick}
          className="rounded-full"
        >
          {action.label}
        </Button>
      ))}
    </div>
  </div>
));
ActionButtons.displayName = 'ActionButtons';

const TypingIndicator = React.memo<{ avatarSrc?: string; botName: string }>(
  ({ avatarSrc, botName }) => (
    <div className="flex items-start gap-2 widget-fade-in">
      <Avatar src={avatarSrc} fallback={botName} size="sm" />
      <div className="bg-base-100 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm border border-base">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-neutral/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 bg-neutral/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 bg-neutral/60 rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  )
);
TypingIndicator.displayName = 'TypingIndicator';

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  botName,
  welcomeMessage,
  avatarSrc,
  faqs,
  apiBaseUrl,
  botId,
  onClose
}) => {
  const [messages, setMessages] = useState<BubbleMessage[]>([]);
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (state, newMessage: BubbleMessage) => [...state, { ...newMessage, isPending: true }]
  );
  
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentStep, setCurrentStep] = useState<ChatStep>('welcome');
  const [visitorInfo, setVisitorInfo] = useState<Partial<VisitorInfo>>({});
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<Set<number>>(new Set());
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isPending, startTransition] = useTransition();

  // Stable ID generator using crypto.randomUUID()
  const genId = useCallback(() => crypto.randomUUID(), []);

  // React 19.2: useEffectEvent for non-reactive scroll behavior
  const scrollToBottom = useEffectEvent(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(timer => clearTimeout(timer));
      timersRef.current.clear();
      abortControllerRef.current?.abort();
    };
  }, []);

  // Auto-scroll when messages change (using useEffectEvent)
  useEffect(() => {
    scrollToBottom();
  }, [optimisticMessages]);

  // React 19.2: useEffectEvent for timer management (no deps issues)
  const setManagedTimeout = useEffectEvent((fn: () => void, delay: number) => {
    const timer = window.setTimeout(() => {
      fn();
      timersRef.current.delete(timer);
    }, delay);
    timersRef.current.add(timer);
    return timer;
  });

  // Add messages with optimistic updates
  const addBotMessage = useCallback((
    content: string, 
    type: BubbleMessage['type'] = 'bot', 
    extraData?: Partial<BubbleMessage>
  ) => {
    const msg: BubbleMessage = {
      id: genId(),
      type,
      content,
      timestamp: new Date().toISOString(),
      ...extraData
    };
    setMessages(prev => [...prev, msg]);
  }, [genId]);

  const addUserMessage = useCallback((content: string) => {
    const msg: BubbleMessage = {
      id: genId(),
      type: 'user',
      content,
      timestamp: new Date().toISOString()
    };
    
    // Optimistic update
    addOptimisticMessage(msg);
    
    // Actual state update
    startTransition(() => {
      setMessages(prev => [...prev, msg]);
    });
  }, [genId, addOptimisticMessage]);

  // Handlers with useEffectEvent (no exhaustive deps)
  const handleContactSupport = useEffectEvent(() => {
    addUserMessage('I want to contact support');
    setCurrentStep('asking-name');
    setIsTyping(true);
    
    setManagedTimeout(() => {
      setIsTyping(false);
      addBotMessage("I'd be happy to connect you with our team! First, what's your name?", 'bot');
    }, 600);
  });

  const handleFaqHelpful = useEffectEvent(() => {
    addUserMessage('This helped, thanks!');
    setIsTyping(true);
    
    setManagedTimeout(() => {
      setIsTyping(false);
      addBotMessage('Great! I\'m glad I could help. Is there anything else?', 'bot');
      
      setManagedTimeout(() => {
        addBotMessage('', 'action-buttons', {
          actions: [
            { label: '← Back to FAQs', onClick: handleBackToFaqs },
            { label: '💬 Contact Support', onClick: handleContactSupport }
          ]
        });
      }, 300);
    }, 400);
  });

  const handleBackToFaqs = useEffectEvent(() => {
    addUserMessage('Show me FAQs again');
    setCurrentStep('showing-faqs');
    setIsTyping(true);
    
    setManagedTimeout(() => {
      setIsTyping(false);
      addBotMessage('Here are the common questions:', 'faq-list', { faqs });
      
      setManagedTimeout(() => {
        addBotMessage('', 'action-buttons', {
          actions: [{ label: '💬 Contact Support', onClick: handleContactSupport }]
        });
      }, 300);
    }, 300);
  });

  const handleFaqClick = useEffectEvent((faq: FAQ) => {
    setCurrentStep('showing-faq-detail');
    addUserMessage(faq.question);
    setIsTyping(true);

    setManagedTimeout(() => {
      setIsTyping(false);
      addBotMessage(faq.answer, 'faq-answer');
      
      setManagedTimeout(() => {
        addBotMessage('', 'action-buttons', {
          actions: [
            { label: '👍 This helped', onClick: handleFaqHelpful },
            { label: '💬 I need more help', onClick: handleContactSupport },
            { label: '← Back to FAQs', onClick: handleBackToFaqs }
          ]
        });
      }, 300);
    }, 700);
  });

  // Initial welcome flow (only runs once)
  useEffect(() => {
    const welcomeMsg: BubbleMessage = {
      id: genId(),
      type: 'bot',
      content: welcomeMessage || `Hi! I'm ${botName}. How can I help you today?`,
      timestamp: new Date().toISOString()
    };

    const faqPrompt: BubbleMessage = {
      id: genId(),
      type: 'faq-list',
      content: 'Here are some common questions:',
      timestamp: new Date().toISOString(),
      faqs
    };

    const actionButtons: BubbleMessage = {
      id: genId(),
      type: 'action-buttons',
      content: '',
      timestamp: new Date().toISOString(),
      actions: [{ label: '💬 Contact Support', onClick: handleContactSupport }]
    };

    setManagedTimeout(() => setMessages([welcomeMsg]), 200);
    setManagedTimeout(() => setMessages(prev => [...prev, faqPrompt]), 450);
    setManagedTimeout(() => setMessages(prev => [...prev, actionButtons]), 700);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Form handlers
  const handleNameSubmit = useEffectEvent(() => {
    if (!inputText.trim()) return;
    
    const name = inputText.trim();
    
    startTransition(() => {
      setVisitorInfo(prev => ({ ...prev, name }));
      addUserMessage(name);
      setInputText('');
      setCurrentStep('asking-email');
      setIsTyping(true);
      
      setManagedTimeout(() => {
        setIsTyping(false);
        addBotMessage(`Nice to meet you, ${name}! What's your email address?`, 'bot');
      }, 600);
    });
  });

  // React 19.2: Async action with AbortController + cacheSignal pattern
  const handleEmailSubmit = useEffectEvent(async () => {
    if (!inputText.trim()) return;
    
    const email = inputText.trim();
    const fullVisitorInfo: VisitorInfo = { name: visitorInfo.name!, email };
    
    // Optimistic update
    const optimisticMsg: BubbleMessage = {
      id: genId(),
      type: 'user',
      content: email,
      timestamp: new Date().toISOString()
    };
    
    addOptimisticMessage(optimisticMsg);
    setInputText('');
    setIsTyping(true);

    // React 19.2: Use AbortController (similar to cacheSignal pattern)
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`${apiBaseUrl}/api/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          botId,
          visitor_info: fullVisitorInfo,
          channel: 'website',
          attributes: {
            current_page_url: window.location.href,
            referrer_url: document.referrer,
            user_agent: navigator.userAgent
          }
        })
      });

      if (!response.ok) throw new Error('Failed to start conversation');

      const data = await response.json();
      
      startTransition(() => {
        setMessages(prev => [...prev, optimisticMsg]);
        setConversation(data.conversation);
        setSessionToken(data.sessionToken);
        setVisitorInfo(fullVisitorInfo);
        
        localStorage.setItem(`cali_chat_${botId}`, JSON.stringify({
          conversationId: data.conversation.id,
          sessionToken: data.sessionToken,
          visitorInfo: fullVisitorInfo,
          expiresAt: Date.now() + 24 * 60 * 60 * 1000
        }));

        setIsTyping(false);
        setCurrentStep('chatting');
        addBotMessage("Perfect! You're now connected. How can I help you?", 'bot');
      });
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      startTransition(() => {
        setMessages(prev => [...prev, optimisticMsg]);
        setIsTyping(false);
        addBotMessage('Sorry, something went wrong. Please try again.', 'bot');
      });
    }
  });

  const handleChatMessage = useEffectEvent(async () => {
    if (!inputText.trim() || !conversation || !sessionToken) return;

    const userMsg = inputText.trim();
    
    const optimisticMsg: BubbleMessage = {
      id: genId(),
      type: 'user',
      content: userMsg,
      timestamp: new Date().toISOString()
    };

    addOptimisticMessage(optimisticMsg);
    setInputText('');
    setIsTyping(true);

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/conversations/${conversation.id}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`
          },
          signal: abortControllerRef.current.signal,
          body: JSON.stringify({
            content: { text: userMsg },
            sender_type: 'USER'
          })
        }
      );

      if (!response.ok) throw new Error('Failed to send message');

      const data = await response.json();
      
      startTransition(() => {
        setMessages(prev => [...prev, optimisticMsg]);
        setIsTyping(false);
        
        if (data.botResponse) {
          addBotMessage(data.botResponse.content.text, 'bot');
        }
      });
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      startTransition(() => {
        setMessages(prev => [...prev, optimisticMsg]);
        setIsTyping(false);
        addBotMessage('Sorry, something went wrong. Please try again.', 'bot');
      });
    }
  });

  // Polling for new messages (Live Chat)
  useEffect(() => {
    if (currentStep !== 'chatting' || !conversation) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/conversations/${conversation.id}/messages`);
        if (!response.ok) return;
        
        const data = await response.json();
        const allMessages = data.messages || [];
        
        startTransition(() => {
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id));
            const newMessages = allMessages.filter((m: any) => 
              !existingIds.has(m.id) && (m.sender_type === 'AGENT' || m.sender_type === 'BOT')
            );

            if (newMessages.length === 0) return prev;

            const newBubbleMessages: BubbleMessage[] = newMessages.map((m: any) => ({
              id: m.id,
              type: m.sender_type === 'AGENT' ? 'agent' : 'bot',
              content: m.content.text,
              timestamp: m.timestamp,
              agentName: m.agent_info?.name
            }));

            return [...prev, ...newBubbleMessages];
          });
        });
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [currentStep, conversation, apiBaseUrl]);

  const handleSubmit = useCallback(() => {
    if (!inputText.trim()) return;

    switch (currentStep) {
      case 'asking-name': return handleNameSubmit();
      case 'asking-email': return handleEmailSubmit();
      case 'chatting': return handleChatMessage();
    }
  }, [currentStep, inputText, handleNameSubmit, handleEmailSubmit, handleChatMessage]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const placeholder = useMemo(() => {
    switch (currentStep) {
      case 'asking-name': return 'Enter your name...';
      case 'asking-email': return 'Enter your email...';
      case 'chatting': return 'Type your message...';
      default: return 'Type a message...';
    }
  }, [currentStep]);

  const showInput = useMemo(() => 
    currentStep === 'asking-name' || currentStep === 'asking-email' || currentStep === 'chatting',
    [currentStep]
  );

  return (
    <div className="w-[380px] h-[600px] rounded-2xl bg-base-100 shadow-2xl flex flex-col overflow-hidden border border-base">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-primary text-primary-content">
        <div className="flex items-center gap-3">
          <Avatar src={avatarSrc} fallback={botName} size="md" showStatus />
          <div>
            <h3 className="font-semibold text-sm">{botName}</h3>
            <span className="text-xs opacity-90">Online</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="h-8 w-8 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <ScrollArea.Root className="flex-1 overflow-hidden bg-base-200">
        <ScrollArea.Viewport className="w-full h-full">
          <div className="p-4 space-y-3">
            {optimisticMessages.map((message) => (
              <div key={message.id} className="widget-fade-in">
                {message.type === 'user' ? (
                  <UserMessage content={message.content} isPending={message.isPending} />
                ) : message.type === 'faq-list' ? (
                  <FAQList 
                    faqs={message.faqs || []} 
                    onSelect={handleFaqClick}
                    message={message.content}
                    avatarSrc={avatarSrc}
                  />
                ) : message.type === 'action-buttons' ? (
                  <ActionButtons actions={message.actions || []} avatarSrc={avatarSrc} />
                ) : message.type === 'agent' ? (
                  <AgentMessage 
                    content={message.content}
                    agentName={message.agentName}
                  />
                ) : (
                  <BotMessage 
                    content={message.content} 
                    avatarSrc={avatarSrc}
                    botName={botName}
                  />
                )}
              </div>
            ))}

            {/* React 19.2: Activity API for typing indicator */}
            <Activity mode={isTyping ? 'visible' : 'hidden'}>
              <TypingIndicator avatarSrc={avatarSrc} botName={botName} />
            </Activity>

            <div ref={scrollRef} />
          </div>
        </ScrollArea.Viewport>

        <ScrollArea.Scrollbar className="flex touch-none select-none w-2 bg-transparent p-0.5" orientation="vertical">
          <ScrollArea.Thumb className="relative flex-1 rounded-full bg-neutral/30 hover:bg-neutral/50 transition-colors" />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>

      {/* Input - React 19.2: Activity API to preserve input state */}
      <Activity mode={showInput ? 'visible' : 'hidden'}>
        <div className="p-4 border-t border-base bg-base-100">
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            <div className="flex items-end gap-2">
              <textarea
                placeholder={placeholder}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                rows={1}
                disabled={isPending}
                className={cn(
                  "flex-1 px-4 py-3 rounded-xl border border-base resize-none bg-base-100 text-base-content",
                  "text-sm placeholder:text-neutral min-h-11 max-h-32",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              />
             <Button
  type="submit"
  disabled={!inputText.trim() || isPending}
  variant="primary"
  isLoading={isPending}
  className="h-11 w-11 p-0 flex items-center justify-center"
>
  <Send className="h-5 w-5" />
</Button>
            </div>
          </form>
        </div>
      </Activity>
    </div>
  );
};