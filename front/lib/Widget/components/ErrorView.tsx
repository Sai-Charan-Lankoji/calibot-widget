import React from "react";
import { Button } from "./ui/Button";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorViewProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export const ErrorView: React.FC<ErrorViewProps> = ({
  title = "Oops! Something went wrong",
  message,
  onRetry,
  isRetrying = false,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
      {/* Error Icon */}
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-destructive" />
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-card-foreground">
        {title}
      </h3>

      {/* Message */}
      <p className="text-sm text-muted-foreground max-w-sm">
        {message}
      </p>

      {/* Retry Button */}
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="primary"
          isLoading={isRetrying}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Button>
      )}

      {/* Help Text */}
      <p className="text-xs text-muted-foreground">
        If the problem persists, please contact support
      </p>
    </div>
  );
};