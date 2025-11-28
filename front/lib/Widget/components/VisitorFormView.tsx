import React, { useState } from "react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { User, Mail, MessageSquare } from "lucide-react";

interface VisitorFormData {
  name: string;
  email: string;
  message?: string;
}

interface VisitorFormViewProps {
  onSubmit: (data: VisitorFormData) => void;
  onSkip?: () => void;
  isLoading?: boolean;
  requireMessage?: boolean;
}

export const VisitorFormView: React.FC<VisitorFormViewProps> = ({
  onSubmit,
  onSkip,
  isLoading = false,
  requireMessage = false,
}) => {
  const [formData, setFormData] = useState<VisitorFormData>({
    name: "",
    email: "",
    message: "",
  });

  const [errors, setErrors] = useState<Partial<VisitorFormData>>({});

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Partial<VisitorFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (requireMessage && !formData.message?.trim()) {
      newErrors.message = "Message is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
  };

  const handleChange = (field: keyof VisitorFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="p-4 space-y-4 animate-in fade-in slide-in-from-bottom-2">
      {/* Header */}
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <User className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-card-foreground mb-1">
          Let's get started
        </h3>
        <p className="text-sm text-muted-foreground">
          Please share your details so we can help you better
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Name Input */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-foreground mb-1"
          >
            Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="John Doe"
              disabled={isLoading}
              error={errors.name}
              className="pl-10"
            />
          </div>
        </div>

        {/* Email Input */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-foreground mb-1"
          >
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="john@example.com"
              disabled={isLoading}
              error={errors.email}
              className="pl-10"
            />
          </div>
        </div>

        {/* Message Input (Optional or Required) */}
        <div>
          <label
            htmlFor="message"
            className="block text-sm font-medium text-foreground mb-1"
          >
            Message{" "}
            {!requireMessage && (
              <span className="text-muted-foreground">(Optional)</span>
            )}
          </label>
          <div className="relative">
            <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleChange("message", e.target.value)}
              placeholder="How can we help you?"
              disabled={isLoading}
              rows={3}
              className={`
                input pl-10 resize-none
                ${errors.message ? "border-destructive" : ""}
              `}
            />
          </div>
          {errors.message && (
            <p className="text-xs text-destructive mt-1 px-1">
              {errors.message}
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pt-2">
          {onSkip && (
            <Button
              type="button"
              variant="ghost"
              onClick={onSkip}
              disabled={isLoading}
              className="flex-1"
            >
              Skip
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            className="flex-1"
          >
            Continue
          </Button>
        </div>
      </form>

      {/* Privacy Note */}
      <p className="text-xs text-muted-foreground text-center">
        We respect your privacy. Your information is secure.
      </p>
    </div>
  );
};