import React, { useState, useCallback } from "react";
import { ArrowLeft, Mail, User } from "lucide-react";
import { VisitorInfo } from "@/types";
import { ErrorView } from "./ErrorView";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

interface VisitorFormViewProps {
  botName: string;
  onSubmit: (info: VisitorInfo) => void;
  onBack: () => void;
  isLoading: boolean;
  error?: string | null;
  onDismissError?: () => void;
}

export const VisitorFormView = React.memo<VisitorFormViewProps>(
  ({
    botName,
    onSubmit,
    onBack,
    isLoading,
    error,
    onDismissError
  }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    const handleSubmit = useCallback((e: React.FormEvent) => {
      e.preventDefault();
      onSubmit({ name, email });
    }, [name, email, onSubmit]);

    return (
      <div className="w-[380px] rounded-2xl bg-base-100 shadow-2xl border border-base overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-base bg-base-200">
          <button
            onClick={onBack}
            disabled={isLoading}
            className="flex items-center justify-center h-9 w-9 rounded-lg hover:bg-base-300 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="h-4 w-4 text-base-content" />
          </button>
          <span className="text-sm font-medium text-base-content">Back to FAQs</span>
        </div>

        {error && onDismissError && (
          <div className="px-6 pt-6">
            <ErrorView message={error} onDismiss={onDismissError} />
          </div>
        )}

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <h3 className="font-bold text-xl text-base-content">Start a conversation</h3>
              <p className="text-sm text-neutral leading-relaxed">
                Chat with {botName}. We typically respond within a few minutes.
              </p>
            </div>

            <Input
              label="Your Name"
              icon={<User className="h-4 w-4" />}
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading}
            />

            <Input
              label="Email Address"
              icon={<Mail className="h-4 w-4" />}
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="w-full"
            >
              Start Chat
            </Button>

            <p className="text-xs text-center text-neutral">
              By continuing, you agree to our terms of service
            </p>
          </form>
        </div>
      </div>
    );
  }
);

VisitorFormView.displayName = 'VisitorFormView';