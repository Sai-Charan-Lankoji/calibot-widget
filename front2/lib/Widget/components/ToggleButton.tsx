"use client"

import React, { memo } from "react"
import { MessageCircle } from "lucide-react"
import { cn } from "../utils/cn"

// ============================================================================
// TYPES
// ============================================================================

interface ToggleButtonProps {
  onClick: () => void
  primaryColor?: string
  avatarSrc?: string
  isLoading?: boolean
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const LoadingSpinner: React.FC = memo(() => (
  <div 
    className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" 
    role="status"
    aria-label="Loading"
  />
));
LoadingSpinner.displayName = 'LoadingSpinner';

const AvatarImage: React.FC<{ src: string }> = memo(({ src }) => (
  <img
    src={src}
    alt="Chat avatar"
    className="w-10 h-10 rounded-theme-avatar object-cover"
    loading="lazy"
  />
));
AvatarImage.displayName = 'AvatarImage';

const ChatIcon: React.FC = memo(() => (
  <MessageCircle className="w-7 h-7" aria-hidden="true" />
));
ChatIcon.displayName = 'ChatIcon';

const PulseEffect: React.FC = memo(() => (
  <div 
    className="absolute inset-0 rounded-theme-avatar bg-theme-primary opacity-40 animate-ping pointer-events-none" 
    aria-hidden="true"
  />
));
PulseEffect.displayName = 'PulseEffect';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ToggleButton: React.FC<ToggleButtonProps> = memo(({
  onClick,
  avatarSrc,
  isLoading = false,
}) => {
  const hasAvatar = Boolean(avatarSrc);

  // Determine button content based on state
  const renderContent = () => {
    if (isLoading) return <LoadingSpinner />;
    if (hasAvatar && avatarSrc) return <AvatarImage src={avatarSrc} />;
    return <ChatIcon />;
  };

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={cn(
        // Base styles
        "relative flex items-center justify-center w-14 h-14 rounded-theme-avatar shadow-lg",
        "transition-all duration-200",
        // Hover/active states
        "hover:scale-110 active:scale-95",
        // Focus styles
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-primary",
        // Disabled state
        "disabled:opacity-50 disabled:cursor-not-allowed",
        // Conditional styling based on avatar presence
        hasAvatar
          ? "bg-white border-2 border-theme-primary"
          : "bg-theme-primary text-theme-primary-content"
      )}
      aria-label="Open chat"
      type="button"
    >
      {renderContent()}
      
      {/* Pulse animation - only show when no avatar */}
      {!hasAvatar && !isLoading && <PulseEffect />}
    </button>
  );
});

ToggleButton.displayName = 'ToggleButton';
