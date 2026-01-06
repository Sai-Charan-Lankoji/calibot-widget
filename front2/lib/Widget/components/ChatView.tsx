import React, { useState, useEffect, useRef } from "react";
import { X, Send } from "lucide-react";
import { Conversation, Message, VisitorInfo } from "@/types";
import { cn } from "../utils/cn";
import * as ScrollArea from "@radix-ui/react-scroll-area";

interface ChatViewProps {
  conversation: Conversation;
  sessionToken: string;
  apiBaseUrl: string;
  visitorInfo: VisitorInfo;
  botName?: string;
  avatarSrc?: string;
  onClose: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  conversation,
  sessionToken,
  apiBaseUrl,
  visitorInfo,
  botName = 'Support',
  avatarSrc,
  onClose
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      conversation_id: conversation.id,
      sender_type: 'USER',
      content: { text: inputText },
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/conversations/${conversation.id}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`
          },
          body: JSON.stringify({
            content: { text: inputText },
            sender_type: 'USER'
          })
        }
      );

      if (!response.ok) throw new Error('Failed to send message');

      const data = await response.json();
      
      if (data.botResponse) {
        setMessages(prev => [...prev, data.botResponse]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        conversation_id: conversation.id,
        sender_type: 'BOT',
        content: { text: 'Sorry, something went wrong. Please try again.' },
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="w-[380px] h-[600px] rounded-2xl bg-theme-base-100 shadow-2xl flex flex-col overflow-hidden border border-theme-base">
      {/* Header - Using primary colors */}
      <div className="flex items-center justify-between p-4 bg-theme-primary text-theme-primary-content">
        <div className="flex items-center gap-3">
          <div className="relative">
            {avatarSrc ? (
              <img 
                src={avatarSrc} 
                alt="Avatar" 
                className="w-10 h-10 rounded-full object-cover ring-2 ring-white/20"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-sm font-semibold">
                {botName.charAt(0)}
              </div>
            )}
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-theme-success rounded-full border-2 border-theme-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{botName}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs opacity-90">Online • Typically replies instantly</span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="h-8 w-8 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages - Using base colors */}
      <ScrollArea.Root className="flex-1 overflow-hidden bg-theme-base-200">
        <ScrollArea.Viewport className="w-full h-full">
          <div className="p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-theme-secondary flex items-center justify-center">
                  <span className="text-2xl">👋</span>
                </div>
                <p className="font-medium text-theme-base-content mb-1">
                  Welcome, {visitorInfo.name}!
                </p>
                <p className="text-sm text-theme-neutral">
                  How can we help you today?
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex flex-col widget-fade-in",
                  message.sender_type === 'USER' ? "items-end" : "items-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] px-4 py-2.5 rounded-2xl text-sm shadow-sm",
                    message.sender_type === 'USER'
                      ? "bg-theme-primary text-theme-primary-content rounded-br-md"
                      : "bg-theme-base-100 border border-theme-base text-theme-base-content rounded-bl-md"
                  )}
                >
                  {message.content.text}
                </div>
                <div className="text-xs text-theme-neutral mt-1.5 px-1">
                  {new Date(message.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-start widget-fade-in">
                <div className="bg-theme-base-100 border border-theme-base px-5 py-3 rounded-2xl rounded-bl-md shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-theme-neutral rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-theme-neutral rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-theme-neutral rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={scrollRef} />
          </div>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar
          className="flex touch-none select-none w-2 bg-transparent p-0.5"
          orientation="vertical"
        >
          <ScrollArea.Thumb className="relative flex-1 rounded-full bg-theme-neutral/30 hover:bg-theme-neutral/50 transition-colors" />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>

      {/* Input - Using base colors */}
      <div className="p-4 border-t border-theme-base bg-theme-base-100">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              placeholder="Type your message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              rows={1}
              className={cn(
                "w-full px-4 py-3 pr-12 rounded-xl border border-theme-base resize-none bg-theme-base-100 text-theme-base-content",
                "text-sm placeholder:text-theme-neutral",
                "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/20 focus:border-[hsl(var(--primary))]",
                "transition-all max-h-32"
              )}
              style={{ 
                minHeight: '44px',
                height: 'auto'
              }}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!inputText.trim()}
            className={cn(
              "h-11 w-11 rounded-xl flex items-center justify-center shrink-0",
              "bg-theme-primary text-theme-primary-content shadow-sm",
              "hover:brightness-110 active:scale-95 transition-all",
              "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[hsl(var(--primary))]",
              "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            )}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        <p className="text-xs text-theme-neutral mt-2 text-center">
          Press Enter to send, Shift + Enter for new line
        </p>
      </div>
    </div>
  );
};