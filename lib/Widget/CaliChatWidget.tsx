import React, { useEffect, useState } from "react";
import { WidgetConfig, BotConfiguration, FAQ, Conversation, VisitorInfo, Message, ViewState } from "@/types";
import { cn } from "./utils/cn";
import { ToggleButton } from "./components/ToggleButton";
import { FAQListView } from "./components/FAQListView";
import { FAQDetailView } from "./components/FAQDetailView";
import { VisitorFormView } from "./components/VisitorFormView";
import { ChatView } from "./components/ChatView";
import "./globals.css";

interface WidgetState {
  view: ViewState;
  bot: BotConfiguration | null;
  faqs: FAQ[];
  selectedFaq: FAQ | null;
  conversation: Conversation | null;
  sessionToken: string | null;
  visitorInfo: VisitorInfo | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

// Default fallback configuration
const DEFAULT_BOT_CONFIG: BotConfiguration = {
  id: 'fallback',
  bot_name: 'Support Assistant',
  welcome_message: 'Hi! Our chat service is currently unavailable, but here are some common questions that might help.',
  theme_config: {
    primaryColor: '#3B82F6',
    position: 'bottom-right'
  },
  feature_config: {
    has_live_chat_agents: false,
    agent_transfer_enabled: false
  }
};

// Default FAQs when bot fails to load
const DEFAULT_FAQS: FAQ[] = [
  {
    id: 'faq-1',
    question: 'Why is the chat not working?',
    answer: 'The chat service may be temporarily unavailable due to maintenance or connectivity issues. Please try again in a few minutes.',
    tags: ['technical', 'troubleshooting']
  },
  {
    id: 'faq-2',
    question: 'How can I contact support?',
    answer: 'You can reach our support team via email at support@example.com or call us during business hours.',
    tags: ['contact', 'support']
  },
  {
    id: 'faq-3',
    question: 'What are your business hours?',
    answer: 'We are available Monday to Friday, 9 AM - 6 PM EST. Weekend support is available via email.',
    tags: ['hours', 'availability']
  },
  {
    id: 'faq-4',
    question: 'How long does it take to get a response?',
    answer: 'We typically respond to inquiries within 24 hours during business days. Urgent matters are prioritized.',
    tags: ['response-time', 'support']
  }
];

// Helper function to convert hex to HSL
function hexToHSL(hex: string): string {
  // Remove the # if present
  hex = hex.replace('#', '');
  
  // Convert hex to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return `${h} ${s}% ${l}%`;
}

export const CaliChatWidget: React.FC<WidgetConfig> = ({ 
  botId, 
  apiBaseUrl,
  primaryColor = '#3B82F6',
  avatarSrc,
  botName,
  welcomeMessage,
  position = 'bottom-right'
}) => {
  const [state, setState] = useState<WidgetState>({
    view: 'closed',
    bot: null,
    faqs: [],
    selectedFaq: null,
    conversation: null,
    sessionToken: null,
    visitorInfo: null,
    messages: [],
    isLoading: false,
    error: null
  });

  useEffect(() => {
    const initWidget = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/widget/init/${botId}`);
        if (!response.ok) throw new Error('Failed to initialize widget');
        
        const data = await response.json();
        setState(prev => ({
          ...prev,
          bot: data.bot,
          faqs: data.faqs,
          error: null
        }));

        // Set primary color from bot config or prop
        const color = data.bot.theme_config?.primaryColor || primaryColor;
        if (color.startsWith('#')) {
          const hsl = hexToHSL(color);
          document.documentElement.style.setProperty('--color-primary', hsl);
        }
      } catch (error) {
        console.error('Widget initialization error:', error);
        // Use default config on error
        setState(prev => ({ 
          ...prev, 
          bot: DEFAULT_BOT_CONFIG,
          faqs: DEFAULT_FAQS,
          error: 'Unable to connect to chat service. Showing offline FAQs.'
        }));
      }
    };

    // Set initial primary color
    if (primaryColor.startsWith('#')) {
      const hsl = hexToHSL(primaryColor);
      document.documentElement.style.setProperty('--color-primary', hsl);
    }

    initWidget();

    const storedSession = localStorage.getItem(`cali_chat_${botId}`);
    if (storedSession) {
      try {
        const session = JSON.parse(storedSession);
        if (session.expiresAt > Date.now()) {
          setState(prev => ({
            ...prev,
            conversation: { id: session.conversationId, status: 'ACTIVE' } as Conversation,
            sessionToken: session.sessionToken,
            visitorInfo: session.visitorInfo
          }));
        } else {
          localStorage.removeItem(`cali_chat_${botId}`);
        }
      } catch (e) {
        console.error('Error restoring session:', e);
      }
    }
  }, [botId, apiBaseUrl, primaryColor]);

  const openWidget = () => setState(prev => ({ ...prev, view: 'faq-list' }));
  const closeWidget = () => setState(prev => ({ ...prev, view: 'closed' }));

  const showFaqDetail = (faq: FAQ) => {
    setState(prev => ({ ...prev, view: 'faq-detail', selectedFaq: faq }));
  };

  const showVisitorForm = () => {
    setState(prev => ({ ...prev, view: 'visitor-form' }));
  };

  const backToFaqList = () => {
    setState(prev => ({ ...prev, view: 'faq-list', selectedFaq: null }));
  };

  const dismissError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  const startConversation = async (visitorInfo: VisitorInfo) => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch(`${apiBaseUrl}/api/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botId,
          visitor_info: visitorInfo,
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
      
      localStorage.setItem(`cali_chat_${botId}`, JSON.stringify({
        conversationId: data.conversation.id,
        sessionToken: data.sessionToken,
        visitorInfo,
        expiresAt: Date.now() + (24 * 60 * 60 * 1000)
      }));

      setState(prev => ({
        ...prev,
        view: 'chat',
        conversation: data.conversation,
        sessionToken: data.sessionToken,
        visitorInfo,
        isLoading: false,
        error: null
      }));
    } catch (error) {
      console.error('Error starting conversation:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: 'Unable to start conversation. Please try again or contact support directly.' 
      }));
    }
  };

  const positionClass = position === 'bottom-left' ? 'left-4' : 'right-4';

  return (
    <div className={cn("cali-chat-widget fixed bottom-4 z-50", positionClass)}>
      {state.view === 'closed' && (
        <ToggleButton 
          onClick={openWidget} 
          primaryColor={primaryColor}
        />
      )}

      {state.view === 'faq-list' && (
        <div className="widget-animate-in">
          <FAQListView
            faqs={state.faqs}
            botName={botName || state.bot?.bot_name || 'Support'}
            welcomeMessage={welcomeMessage || state.bot?.welcome_message}
            onSelect={showFaqDetail}
            onStartChat={showVisitorForm}
            onClose={closeWidget}
            error={state.error}
            onDismissError={dismissError}
          />
        </div>
      )}

      {state.view === 'faq-detail' && state.selectedFaq && (
        <div className="widget-animate-in">
          <FAQDetailView
            faq={state.selectedFaq}
            onBack={backToFaqList}
            onNeedHelp={showVisitorForm}
          />
        </div>
      )}

      {state.view === 'visitor-form' && (
        <div className="widget-animate-in">
          <VisitorFormView
            botName={botName || state.bot?.bot_name || 'Support'}
            onSubmit={startConversation}
            onBack={backToFaqList}
            isLoading={state.isLoading}
            error={state.error}
            onDismissError={dismissError}
          />
        </div>
      )}

      {state.view === 'chat' && state.conversation && state.sessionToken && (
        <div className="widget-animate-in">
          <ChatView
            conversation={state.conversation}
            sessionToken={state.sessionToken}
            apiBaseUrl={apiBaseUrl}
            visitorInfo={state.visitorInfo!}
            botName={botName || state.bot?.bot_name}
            avatarSrc={avatarSrc || state.bot?.theme_config?.avatarSrc}
            onClose={closeWidget}
          />
        </div>
      )}
    </div>
  );
};
