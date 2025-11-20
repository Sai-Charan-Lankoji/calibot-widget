import React, { useState } from "react";
import { ArrowLeft, Loader2, Mail, User } from "lucide-react";
import { VisitorInfo } from "@/types";
import { cn } from "../utils/cn";
import { ErrorView } from "./ErrorView";

interface VisitorFormViewProps {
  botName: string;
  onSubmit: (info: VisitorInfo) => void;
  onBack: () => void;
  isLoading: boolean;
  error?: string | null;
  onDismissError?: () => void;
}

export const VisitorFormView: React.FC<VisitorFormViewProps> = ({
  botName,
  onSubmit,
  onBack,
  isLoading,
  error,
  onDismissError
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, email });
  };

  return (
    <div className="w-[380px] rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-gray-50/50">
        <button
          onClick={onBack}
          disabled={isLoading}
          className={cn(
            "flex items-center justify-center h-9 w-9 rounded-lg",
            "hover:bg-gray-100 transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))]/20",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <ArrowLeft className="h-4 w-4 text-gray-700" />
        </button>
        <span className="text-sm font-medium text-gray-700">Back to FAQs</span>
      </div>

      {/* Error Message */}
      {error && onDismissError && (
        <div className="px-6 pt-6">
          <ErrorView message={error} onDismiss={onDismissError} />
        </div>
      )}

      {/* Form */}
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-bold text-xl text-gray-900">Start a conversation</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Chat with {botName}. We typically respond within a few minutes.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label 
                htmlFor="name" 
                className="text-sm font-medium text-gray-900 flex items-center gap-2"
              >
                <User className="h-4 w-4 text-gray-500" />
                Your Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
                className={cn(
                  "flex h-11 w-full rounded-xl border border-gray-200 bg-white px-4",
                  "text-sm placeholder:text-gray-400",
                  "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))]/20 focus:border-[hsl(var(--color-primary))]",
                  "transition-all",
                  "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50"
                )}
              />
            </div>

            <div className="space-y-2">
              <label 
                htmlFor="email" 
                className="text-sm font-medium text-gray-900 flex items-center gap-2"
              >
                <Mail className="h-4 w-4 text-gray-500" />
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className={cn(
                  "flex h-11 w-full rounded-xl border border-gray-200 bg-white px-4",
                  "text-sm placeholder:text-gray-400",
                  "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))]/20 focus:border-[hsl(var(--color-primary))]",
                  "transition-all",
                  "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50"
                )}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className={cn(
              "w-full flex items-center justify-center gap-2 h-11 px-4",
              "bg-[hsl(var(--color-primary))] text-white rounded-xl font-medium shadow-sm",
              "hover:opacity-90 active:scale-[0.98] transition-all",
              "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[hsl(var(--color-primary))]",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Starting chat...
              </>
            ) : (
              'Start Chat'
            )}
          </button>

          <p className="text-xs text-center text-gray-500">
            By continuing, you agree to our terms of service
          </p>
        </form>
      </div>
    </div>
  );
};