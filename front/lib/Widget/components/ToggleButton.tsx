import React from "react";
import { MessageCircle } from "lucide-react";
import { cn } from "../utils/cn";

interface ToggleButtonProps {
  onClick: () => void;
  primaryColor?: string;
}

export const ToggleButton: React.FC<ToggleButtonProps> = ({ onClick }) => {
  return (
    <div className="relative">
      <div className="absolute inset-0 rounded-full bg-primary opacity-75 animate-ping" />
      <button
        onClick={onClick}
        className={cn(
          "relative flex items-center justify-center w-14 h-14 rounded-full shadow-lg",
          "bg-primary text-primary-content",
          "hover:scale-110 active:scale-95 transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        )}
        aria-label="Open chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    </div>
  );
};