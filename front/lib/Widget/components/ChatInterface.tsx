import React, { useState, useEffect, useRef, useCallback, useMemo, useTransition } from "react";
import { X, Send } from "lucide-react";
import { cn } from "../utils/cn";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import { Avatar } from "./ui/Avatar";
import { Button } from "./ui/Button";
import { ConversationalQuestion } from "./ConversationalQuestion";
import { useChat } from "../hooks/useChat";
import { useLiveChat } from "../hooks/useLiveChat";

type BubbleMessage = {
  id: string;
  type: 'bot' | 'user' | 'conversational-question' | 'action-buttons' | 'agent';
  content: string;
  timestamp: string;
  actions?: Array<{ label: string; onClick: () => void }>;
  question?: string;
  options?: string[];
  currentRank?: number;
  isPending?: boolean;
  agentName?: string;
};

type ChatStep = 'welcome' | 'asking-name' | 'asking-email' | 'chatting';

interface ChatInterfaceProps {
  botName: string;
  welcomeMessage?: string;
  avatarSrc?: string;
  apiBaseUrl: string;
  botId: string;
  onClose: () => void;
}

// Memoized message components (unchanged)
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
  apiBaseUrl,
  botId,
  onClose,
}) => {
  const [messages, setMessages] = useState<BubbleMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentStep, setCurrentStep] = useState<ChatStep>('welcome');
  const [visitorInfo, setVisitorInfo] = useState<{ name?: string; email?: string }>({});
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<Set<number>>(new Set());
  const [isPending, startTransition] = useTransition();

  // Use custom hooks
  const chat = useChat({
    botId,
    apiBaseUrl,
    onError: (error) => console.error('Chat error:', error)
  });

  const liveChat = useLiveChat({
    botId,
    apiBaseUrl,
    onError: (error) => console.error('Live chat error:', error)
  });

  const genId = useCallback(() => crypto.randomUUID(), []);

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    return () => {
      timersRef.current.forEach(timer => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const setManagedTimeout = useCallback((fn: () => void, delay: number) => {
    const timer = window.setTimeout(() => {
      fn();
      timersRef.current.delete(timer);
    }, delay);
    timersRef.current.add(timer);
    return timer;
  }, []);

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

  const addUserMessage = useCallback((content: string, isPending = false) => {
    const msg: BubbleMessage = {
      id: genId(),
      type: 'user',
      content,
      timestamp: new Date().toISOString(),
      isPending
    };
    setMessages(prev => [...prev, msg]);
    return msg;
  }, [genId]);

  // Initialize chat
  useEffect(() => {
    const initialize = async () => {
      try {
        const response = await chat.startChat();
        
        if (!response) return;

        // Add welcome message
        const welcomeMsg: BubbleMessage = {
          id: genId(),
          type: 'bot',
          content: response.greeting || welcomeMessage || `Hi! I'm ${botName}`,
          timestamp: new Date().toISOString()
        };

        setManagedTimeout(() => setMessages([welcomeMsg]), 200);

        // Add first question if available
        if (response.has_questions && response.next_question) {
          setManagedTimeout(() => {
            addBotMessage('', 'conversational-question', {
              question: response.next_question!.question,
              options: response.next_question!.options || [],
              currentRank: response.next_question!.rank
            });
          }, 500);
        } else {
          // No questions available - show contact support
          setManagedTimeout(() => {
            addBotMessage('', 'action-buttons', {
              actions: [{ 
                label: '💬 Contact Support', 
                onClick: handleContactSupport 
              }]
            });
          }, 500);
        }
      } catch (error) {
        console.error('Failed to initialize chat:', error);
        addBotMessage('Sorry, something went wrong. Please try again later.', 'bot');
      }
    };

    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle option selection in conversational flow
  const handleOptionSelect = useCallback(async (option: string) => {
    addUserMessage(option);
    setIsTyping(true);

    try {
      const response = await chat.sendMessage(option);
      setIsTyping(false);

      // Show acknowledgment
      if (response.acknowledged) {
        addBotMessage(response.acknowledged, 'bot');
      }

      // Show next question
      if (response.nextQuestion) {
        setManagedTimeout(() => {
          addBotMessage('', 'conversational-question', {
            question: response.nextQuestion!.question,
            options: response.nextQuestion!.options || [],
            currentRank: response.nextQuestion!.rank
          });
        }, 400);
      } 
      // Conversation ended
      else if (response.ended) {
        addBotMessage(response.endMessage || 'Thank you!', 'bot');
        
        setManagedTimeout(() => {
          addBotMessage('', 'action-buttons', {
            actions: [
              { label: '🔄 Start Over', onClick: handleRestart },
              { label: '💬 Contact Support', onClick: handleContactSupport }
            ]
          });
        }, 500);
      }
    } catch (error: any) {
      setIsTyping(false);
      addBotMessage('Sorry, something went wrong. Please try again.', 'bot');
    }
  }, [chat, addUserMessage, addBotMessage, setManagedTimeout]);

  // Handle contact support
  const handleContactSupport = useCallback(() => {
    addUserMessage('I want to contact support');
    setCurrentStep('asking-name');
    setIsTyping(true);
    
    setManagedTimeout(() => {
      setIsTyping(false);
      addBotMessage("I'd be happy to connect you with our team! First, what's your name?", 'bot');
    }, 600);
  }, [addUserMessage, setManagedTimeout, addBotMessage]);

  // Handle restart
  const handleRestart = useCallback(async () => {
    chat.resetChat();
    setMessages([]);
    setCurrentStep('welcome');
    setIsTyping(true);

    try {
      const response = await chat.startChat();
      setIsTyping(false);

      if (response && response.has_questions) {
        const welcomeMsg: BubbleMessage = {
          id: genId(),
          type: 'bot',
          content: response.greeting,
          timestamp: new Date().toISOString()
        };
        setMessages([welcomeMsg]);

        if (response.next_question) {
          setManagedTimeout(() => {
            addBotMessage('', 'conversational-question', {
              question: response.next_question!.question,
              options: response.next_question!.options || [],
              currentRank: response.next_question!.rank
            });
          }, 400);
        }
      }
    } catch (error) {
      setIsTyping(false);
      addBotMessage('Sorry, could not restart. Please try again.', 'bot');
    }
  }, [chat, genId, addBotMessage, setManagedTimeout]);

  // Form handlers
  const handleNameSubmit = useCallback(() => {
    if (!inputText.trim()) return;
    
    const name = inputText.trim();
    setVisitorInfo(prev => ({ ...prev, name }));
    addUserMessage(name);
    setInputText('');
    setCurrentStep('asking-email');
    setIsTyping(true);
    
    setManagedTimeout(() => {
      setIsTyping(false);
      addBotMessage(`Nice to meet you, ${name}! What's your email address?`, 'bot');
    }, 600);
  }, [inputText, addUserMessage, setManagedTimeout, addBotMessage]);

  const handleEmailSubmit = useCallback(async () => {
    if (!inputText.trim()) return;
    
    const email = inputText.trim();
    const fullVisitorInfo = { name: visitorInfo.name!, email };
    
    addUserMessage(email, true);
    setInputText('');
    setIsTyping(true);

    try {
      await liveChat.startConversation(fullVisitorInfo);
      
      setVisitorInfo(fullVisitorInfo);
      setIsTyping(false);
      setCurrentStep('chatting');
      addBotMessage("Perfect! You're now connected. How can I help you?", 'bot');
      
      // Start polling for agent messages
      liveChat.startPolling();
    } catch (error) {
      setIsTyping(false);
      addBotMessage('Sorry, something went wrong. Please try again.', 'bot');
    }
  }, [inputText, visitorInfo, liveChat, addUserMessage, addBotMessage]);

  const handleChatMessage = useCallback(async () => {
    if (!inputText.trim()) return;

    const userMsg = inputText.trim();
    addUserMessage(userMsg, true);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await liveChat.sendMessage(userMsg);
      setIsTyping(false);
      
      if (response?.botResponse) {
        addBotMessage(response.botResponse.content.text, 'bot');
      }
    } catch (error) {
      setIsTyping(false);
      addBotMessage('Sorry, something went wrong. Please try again.', 'bot');
    }
  }, [inputText, liveChat, addUserMessage, addBotMessage]);

  // Handle live chat messages from polling
  useEffect(() => {
    if (liveChat.messages.length === 0) return;

    const existingIds = new Set(messages.map(m => m.id));
    const newMessages = liveChat.messages.filter(msg => !existingIds.has(msg.id));

    if (newMessages.length > 0) {
      const newBubbleMessages: BubbleMessage[] = newMessages.map(msg => ({
        id: msg.id,
        type: msg.sender_type === 'AGENT' ? 'agent' : 'bot',
        content: msg.content.text,
        timestamp: msg.timestamp,
        agentName: msg.agent_info?.name
      }));

      setMessages(prev => [...prev, ...newBubbleMessages]);
    }
  }, [liveChat.messages, messages]);

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
            {messages.map((message) => (
              <div key={message.id} className="widget-fade-in">
                {message.type === 'user' ? (
                  <UserMessage content={message.content} isPending={message.isPending} />
                ) : message.type === 'conversational-question' ? (
                  <ConversationalQuestion
                    question={message.question || ''}
                    options={message.options || []}
                    avatarSrc={avatarSrc}
                    botName={botName}
                    onSelectOption={handleOptionSelect}
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

            {isTyping && <TypingIndicator avatarSrc={avatarSrc} botName={botName} />}
            <div ref={scrollRef} />
          </div>
        </ScrollArea.Viewport>

        <ScrollArea.Scrollbar className="flex touch-none select-none w-2 bg-transparent p-0.5" orientation="vertical">
          <ScrollArea.Thumb className="relative flex-1 rounded-full bg-neutral/30 hover:bg-neutral/50 transition-colors" />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>

      {/* Input */}
      {showInput && (
        <div className="p-4 border-t border-base bg-base-100">
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            <div className="flex items-end gap-2">
              <textarea
                placeholder={placeholder}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                rows={1}
                disabled={isPending || chat.isLoading || liveChat.isConnecting}
                className={cn(
                  "flex-1 px-4 py-3 rounded-xl border border-base resize-none bg-base-100 text-base-content",
                  "text-sm placeholder:text-neutral min-h-11 max-h-32",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              />
              <Button
                type="submit"
                disabled={!inputText.trim() || isPending || chat.isLoading || liveChat.isConnecting}
                variant="primary"
                isLoading={isPending || chat.isLoading || liveChat.isConnecting}
                className="h-11 w-11 p-0 flex items-center justify-center"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};