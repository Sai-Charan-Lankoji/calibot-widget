import React from "react";
import { AlertCircle, X } from "lucide-react";
import { cn } from "../utils/cn";

interface ErrorViewProps {
  message: string;
  onDismiss: () => void;
}

export const ErrorView: React.FC<ErrorViewProps> = ({ message, onDismiss }) => {
  return (
    <div className={cn(
      "flex items-start gap-3 p-3 rounded-lg border border-red-200 bg-red-50",
      "text-sm text-red-800 widget-fade-in"
    )}>
      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
      <p className="flex-1">{message}</p>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 text-red-600 hover:text-red-800 transition-colors"
        aria-label="Dismiss error"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};