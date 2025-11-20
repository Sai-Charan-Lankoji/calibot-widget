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
    <div className="w-[380px] h-[600px] rounded-2xl bg-base-100 shadow-2xl flex flex-col overflow-hidden border border-base">
      {/* Header - Primary color */}
      <div className="relative p-6 pb-4 bg-primary text-primary-content">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 h-8 w-8 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="pr-8">
          <h3 className="font-bold text-xl mb-2">{botName}</h3>
          <p className="text-sm opacity-90 leading-relaxed">
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral" />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "w-full h-10 pl-10 pr-4 rounded-lg border border-base bg-base-100 text-base-content",
                "text-sm placeholder:text-neutral",
                "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/20 focus:border-[hsl(var(--primary))]",
                "transition-all"
              )}
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
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-base-200 flex items-center justify-center">
                  <MessageSquare className="h-8 w-8 text-neutral" />
                </div>
                <p className="text-sm text-neutral">
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
                    "bg-base-200 hover:bg-base-300 hover:shadow-sm",
                    "border border-transparent hover:border-base",
                    "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/20"
                  )}
                >
                  <p className="text-sm font-semibold text-base-content line-clamp-2 mb-1">
                    {faq.question}
                  </p>
                  <p className="text-xs text-neutral line-clamp-1">
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
          <ScrollArea.Thumb className="relative flex-1 rounded-full bg-neutral/30 hover:bg-neutral/50 transition-colors" />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>

      {/* Footer CTA - Primary color */}
      <div className="p-4 border-t border-base bg-base-200/50">
        <button
          onClick={onStartChat}
          className={cn(
            "w-full flex items-center justify-center gap-2 h-11 px-4",
            "bg-primary text-primary-content rounded-xl font-medium",
            "hover:bg-primary-hover active:scale-[0.98] transition-all shadow-sm",
            "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[hsl(var(--primary))]"
          )}
        >
          <MessageSquare className="h-4 w-4" />
          Start Live Chat
        </button>
      </div>
    </div>
  );
};