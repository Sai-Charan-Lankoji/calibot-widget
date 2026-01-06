import React from "react";
import { MessageCircle } from "lucide-react";

interface ToggleButtonProps {
  onClick: () => void;
  avatarSrc?: string;
  isLoading?: boolean;
  hasError?: boolean;
}

export const ToggleButton: React.FC<ToggleButtonProps> = ({
  onClick,
  avatarSrc,
  isLoading = false,
  hasError = false,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className="relative w-14 h-14 rounded-full bg-primary hover:bg-primary-hover text-primary-foreground shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2"
      aria-label="Open chat"
    >
      {/* Avatar or Icon */}
      {avatarSrc ? (
        <img
          src={avatarSrc}
          alt="Chat"
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        <MessageCircle className="w-6 h-6" strokeWidth={2} />
      )}

      {/* Loading Spinner Overlay */}
      {isLoading && (
        <div className="absolute inset-0 rounded-full bg-primary/80 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error/Warning Indicator */}
      {hasError && !isLoading && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-warning border-2 border-background"></span>
        </span>
      )}

      {/* Notification Badge (example - can be used for unread count) */}
      {/* Uncomment when needed:
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 badge badge-destructive text-xs min-w-[1.25rem] h-5 flex items-center justify-center">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
      */}
    </button>
  );
};
