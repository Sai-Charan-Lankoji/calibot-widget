import React from "react";
import { ArrowLeft, ThumbsUp, ThumbsDown } from "lucide-react";
import { FAQ } from "@/types";
import { cn } from "../utils/cn";
import * as ScrollArea from "@radix-ui/react-scroll-area";

interface FAQDetailViewProps {
  faq: FAQ;
  onBack: () => void;
  onNeedHelp: () => void;
}

export const FAQDetailView: React.FC<FAQDetailViewProps> = ({
  faq,
  onBack,
  onNeedHelp
}) => {
  const [feedback, setFeedback] = React.useState<'helpful' | 'not-helpful' | null>(null);

  return (
    <div className="w-[380px] h-[600px] rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-gray-50/50">
        <button
          onClick={onBack}
          className={cn(
            "flex items-center justify-center h-9 w-9 rounded-lg",
            "hover:bg-gray-100 transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))]/20"
          )}
        >
          <ArrowLeft className="h-4 w-4 text-gray-700" />
        </button>
        <span className="text-sm font-medium text-gray-700">Back to FAQs</span>
      </div>

      {/* Content */}
      <ScrollArea.Root className="flex-1 overflow-hidden">
        <ScrollArea.Viewport className="w-full h-full">
          <div className="p-6">
            <h3 className="font-bold text-xl mb-4 text-gray-900 leading-tight">
              {faq.question}
            </h3>
            
            <div 
              className="prose prose-sm max-w-none text-gray-600 leading-relaxed"
              dangerouslySetInnerHTML={{ 
                __html: faq.answer_html || faq.answer.replace(/\n/g, '<br />') 
              }}
            />

            {/* Feedback Section */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-700 mb-3">
                Was this helpful?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setFeedback('helpful')}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg border transition-all",
                    feedback === 'helpful'
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50"
                  )}
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span className="text-sm font-medium">Yes</span>
                </button>
                <button
                  onClick={() => setFeedback('not-helpful')}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg border transition-all",
                    feedback === 'not-helpful'
                      ? "border-red-500 bg-red-50 text-red-700"
                      : "border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50"
                  )}
                >
                  <ThumbsDown className="h-4 w-4" />
                  <span className="text-sm font-medium">No</span>
                </button>
              </div>
              {feedback && (
                <p className="text-xs text-gray-500 mt-2 widget-fade-in">
                  Thank you for your feedback!
                </p>
              )}
            </div>
          </div>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar
          className="flex touch-none select-none w-2 bg-transparent p-0.5"
          orientation="vertical"
        >
          <ScrollArea.Thumb className="relative flex-1 rounded-full bg-gray-300 hover:bg-gray-400 transition-colors" />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
        <button 
          onClick={onNeedHelp} 
          className={cn(
            "w-full h-11 px-4 rounded-xl font-medium transition-all",
            "bg-[hsl(var(--color-primary))] text-white shadow-sm",
            "hover:opacity-90 active:scale-[0.98]",
            "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[hsl(var(--color-primary))]"
          )}
        >
          Still need help? Chat with us
        </button>
      </div>
    </div>
  );
};