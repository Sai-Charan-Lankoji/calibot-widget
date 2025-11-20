import React from "react";
import { X, MessageSquare, Search } from "lucide-react";
import { FAQ } from "@/types";
import { cn } from "../utils/cn";
import { ErrorView } from "./ErrorView";
import * as ScrollArea from "@radix-ui/react-scroll-area";

interface FAQListViewProps {
  faqs: FAQ[];
  botName: string;
  welcomeMessage?: string;
  onSelect: (faq: FAQ) => void;
  onStartChat: () => void;
  onClose: () => void;
  error?: string | null;
  onDismissError?: () => void;
}

export const FAQListView: React.FC<FAQListViewProps> = ({
  faqs,
  botName,
  welcomeMessage,
  onSelect,
  onStartChat,
  onClose,
  error,
  onDismissError
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  
  // Get primary color from CSS variable or use default
  const primaryColor = React.useMemo(() => {
    const hsl = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-primary')
      .trim();
    
    if (hsl) {
      return `hsl(${hsl})`;
    }
    return '#3B82F6'; // fallback
  }, []);

  const filteredFaqs = React.useMemo(() => {
    if (!searchQuery.trim()) return faqs;
    
    const query = searchQuery.toLowerCase();
    return faqs.filter(faq => 
      faq.question.toLowerCase().includes(query) ||
      faq.answer.toLowerCase().includes(query) ||
      faq.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }, [faqs, searchQuery]);

  return (
    <div className="w-[380px] h-[600px] rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden border border-gray-200">
      {/* Header */}
      <div 
        className="relative p-6 pb-4 text-white"
        style={{ 
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}e6 100%)`
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 h-8 w-8 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="pr-8">
          <h3 className="font-bold text-xl mb-2">{botName}</h3>
          <p className="text-sm text-white/90 leading-relaxed">
            {welcomeMessage || "How can we help you?"}
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && onDismissError && (
        <div className="px-4 pt-4">
          <ErrorView message={error} onDismiss={onDismissError} />
        </div>
      )}

      {/* Search Bar */}
      {faqs.length > 3 && (
        <div className="px-4 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "w-full h-10 pl-10 pr-4 rounded-lg border border-gray-200",
                "text-sm placeholder:text-gray-400",
                "focus:outline-none focus:ring-2 focus:ring-opacity-20 focus:border-current",
                "transition-all"
              )}
              style={{ 
                '--tw-ring-color': `${primaryColor}33`
              } as React.CSSProperties}
            />
          </div>
        </div>
      )}

      {/* FAQ List */}
      <ScrollArea.Root className="flex-1 overflow-hidden">
        <ScrollArea.Viewport className="w-full h-full">
          <div className="p-4 space-y-2">
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <MessageSquare className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">
                  {searchQuery ? 'No results found' : 'No FAQs available'}
                </p>
              </div>
            ) : (
              filteredFaqs.map((faq) => (
                <button
                  key={faq.id}
                  onClick={() => onSelect(faq)}
                  className={cn(
                    "w-full text-left p-4 rounded-xl transition-all",
                    "bg-gray-50 hover:bg-gray-100 hover:shadow-sm",
                    "border border-transparent hover:border-gray-200",
                    "focus:outline-none focus:ring-2 focus:ring-opacity-20"
                  )}
                  style={{ 
                    '--tw-ring-color': `${primaryColor}33`
                  } as React.CSSProperties}
                >
                  <p className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">
                    {faq.question}
                  </p>
                  <p className="text-xs text-gray-500 line-clamp-1">
                    {faq.answer}
                  </p>
                </button>
              ))
            )}
          </div>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar
          className="flex touch-none select-none w-2 bg-transparent p-0.5"
          orientation="vertical"
        >
          <ScrollArea.Thumb className="relative flex-1 rounded-full bg-gray-300 hover:bg-gray-400 transition-colors" />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>

      {/* Footer CTA */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
        <button
          onClick={onStartChat}
          className={cn(
            "w-full flex items-center justify-center gap-2 h-11 px-4",
            "text-white rounded-xl font-medium",
            "hover:opacity-90 active:scale-[0.98] transition-all shadow-sm",
            "focus:outline-none focus:ring-2 focus:ring-offset-2"
          )}
          style={{ 
            backgroundColor: primaryColor,
            '--tw-ring-color': primaryColor
          } as React.CSSProperties}
        >
          <MessageSquare className="h-4 w-4" />
          Start Live Chat
        </button>
      </div>
    </div>
  );
};