import React, { useState, useCallback } from "react";
import { ArrowLeft, ThumbsUp, ThumbsDown } from "lucide-react";
import { FAQ } from "@/types";
import { cn } from "../utils/cn";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import { Button } from "./ui/Button";

interface FAQDetailViewProps {
  faq: FAQ;
  onBack: () => void;
  onNeedHelp: () => void;
}

export const FAQDetailView = React.memo<FAQDetailViewProps>(
  ({ faq, onBack, onNeedHelp }) => {
    const [feedback, setFeedback] = useState<"helpful" | "not-helpful" | null>(
      null
    );

    const handleFeedback = useCallback(
      (type: "helpful" | "not-helpful") => {
        setFeedback(type);
        // TODO: Send feedback to API
      },
      []
    );

    return (
      <div className="w-[380px] h-[600px] rounded-2xl bg-base-100 shadow-2xl flex flex-col overflow-hidden border border-base">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-base bg-base-200">
          <button
            onClick={onBack}
            className="flex items-center justify-center h-9 w-9 rounded-lg hover:bg-base-300 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <ArrowLeft className="h-4 w-4 text-base-content" />
          </button>
          <span className="text-sm font-medium text-base-content">
            Back to FAQs
          </span>
        </div>

        {/* Content */}
        <ScrollArea.Root className="flex-1 overflow-hidden">
          <ScrollArea.Viewport className="w-full h-full">
            <div className="p-6">
              <h3 className="font-bold text-xl mb-4 text-base-content leading-tight">
                {faq.question}
              </h3>

              <div
                className="prose prose-sm max-w-none text-neutral leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: faq.answer_html || faq.answer.replace(/\n/g, "<br />"),
                }}
              />

              {/* Feedback Section */}
              <div className="mt-8 pt-6 border-t border-base">
                <p className="text-sm font-medium text-base-content mb-3">
                  Was this helpful?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleFeedback("helpful")}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg border transition-all",
                      feedback === "helpful"
                        ? "border-success bg-success/10 text-success"
                        : "border-base hover:bg-base-200 text-base-content"
                    )}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    <span className="text-sm font-medium">Yes</span>
                  </button>
                  <button
                    onClick={() => handleFeedback("not-helpful")}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg border transition-all",
                      feedback === "not-helpful"
                        ? "border-error bg-error/10 text-error"
                        : "border-base hover:bg-base-200 text-base-content"
                    )}
                  >
                    <ThumbsDown className="h-4 w-4" />
                    <span className="text-sm font-medium">No</span>
                  </button>
                </div>
                {feedback && (
                  <p className="text-xs text-neutral mt-2 widget-fade-in">
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
            <ScrollArea.Thumb className="relative flex-1 rounded-full bg-neutral/30 hover:bg-neutral/50 transition-colors" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>

        {/* Footer */}
        <div className="p-4 border-t border-base bg-base-200">
          <Button onClick={onNeedHelp} variant="primary" className="w-full">
            Still need help? Chat with us
          </Button>
        </div>
      </div>
    );
  }
);

FAQDetailView.displayName = "FAQDetailView";