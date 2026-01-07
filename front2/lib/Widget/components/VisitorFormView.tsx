import React, { useState, useCallback } from "react";
import { ArrowLeft, Mail, User, Phone } from "lucide-react";
import { VisitorInfo, BotConfiguration } from "@/types";
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
  botConfig?: BotConfiguration;
}

export const VisitorFormView = React.memo<VisitorFormViewProps>(
  ({
    botName,
    onSubmit,
    onBack,
    isLoading,
    error,
    onDismissError,
    botConfig
  }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [gdprConsent, setGdprConsent] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    const formConfig = botConfig?.feature_forms || {
      requireName: true,
      requireEmail: true,
      requirePhone: false,
      gdprConsent: false,
      privacyPolicyUrl: null
    };

    const validateEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    const handleSubmit = useCallback((e: React.FormEvent) => {
      e.preventDefault();
      
      const errors: Record<string, string> = {};

      // Validate required fields
      if (formConfig.requireName && !name.trim()) {
        errors.name = 'Name is required';
      }

      if (formConfig.requireEmail) {
        if (!email.trim()) {
          errors.email = 'Email is required';
        } else if (!validateEmail(email)) {
          errors.email = 'Please enter a valid email address';
        }
      }

      if (formConfig.requirePhone && !phone.trim()) {
        errors.phone = 'Phone number is required';
      }

      if (formConfig.gdprConsent && !gdprConsent) {
        errors.gdprConsent = 'You must accept the privacy policy to continue';
      }

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        return;
      }

      setValidationErrors({});
      const visitorInfo: VisitorInfo = {
        name: name.trim(),
        email: email.trim()
      };
      
      if (formConfig.requirePhone && phone.trim()) {
        visitorInfo.phone = phone.trim();
      }

      onSubmit(visitorInfo);
    }, [name, email, phone, gdprConsent, formConfig, validateEmail, onSubmit]);

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

            {formConfig.requireName && (
              <div>
                <Input
                  label="Your Name"
                  icon={<User className="h-4 w-4" />}
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (validationErrors.name) {
                      setValidationErrors(prev => ({ ...prev, name: '' }));
                    }
                  }}
                  required={formConfig.requireName}
                  disabled={isLoading}
                />
                {validationErrors.name && (
                  <p className="text-xs text-error mt-1">{validationErrors.name}</p>
                )}
              </div>
            )}

            {formConfig.requireEmail && (
              <div>
                <Input
                  label="Email Address"
                  icon={<Mail className="h-4 w-4" />}
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (validationErrors.email) {
                      setValidationErrors(prev => ({ ...prev, email: '' }));
                    }
                  }}
                  required={formConfig.requireEmail}
                  disabled={isLoading}
                />
                {validationErrors.email && (
                  <p className="text-xs text-error mt-1">{validationErrors.email}</p>
                )}
              </div>
            )}

            {formConfig.requirePhone && (
              <div>
                <Input
                  label="Phone Number"
                  icon={<Phone className="h-4 w-4" />}
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (validationErrors.phone) {
                      setValidationErrors(prev => ({ ...prev, phone: '' }));
                    }
                  }}
                  required={formConfig.requirePhone}
                  disabled={isLoading}
                />
                {validationErrors.phone && (
                  <p className="text-xs text-error mt-1">{validationErrors.phone}</p>
                )}
              </div>
            )}

            {formConfig.gdprConsent && (
              <div>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gdprConsent}
                    onChange={(e) => {
                      setGdprConsent(e.target.checked);
                      if (validationErrors.gdprConsent) {
                        setValidationErrors(prev => ({ ...prev, gdprConsent: '' }));
                      }
                    }}
                    disabled={isLoading}
                    className="mt-0.5 h-4 w-4 rounded border-base-300 text-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <span className="text-sm text-neutral">
                    I agree to the{' '}
                    {formConfig.privacyPolicyUrl ? (
                      <a
                        href={formConfig.privacyPolicyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        privacy policy
                      </a>
                    ) : (
                      <span className="text-primary">privacy policy</span>
                    )}
                    {' '}and terms of service
                  </span>
                </label>
                {validationErrors.gdprConsent && (
                  <p className="text-xs text-error mt-1">{validationErrors.gdprConsent}</p>
                )}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="w-full"
            >
              Start Chat
            </Button>

            {!formConfig.gdprConsent && (
              <p className="text-xs text-center text-neutral">
                By continuing, you agree to our terms of service
              </p>
            )}
          </form>
        </div>
      </div>
    );
  }
);

VisitorFormView.displayName = 'VisitorFormView';