import React from "react";
import { MessageCircle } from "lucide-react";
import { cn } from "../utils/cn";

interface ToggleButtonProps {
  onClick: () => void;
  primaryColor?: string;
}

export const ToggleButton: React.FC<ToggleButtonProps> = ({ onClick, primaryColor = '#3B82F6' }) => {
  return (
    <div className="relative">
      {/* Pulse ring */}
      <div 
        className="absolute inset-0 rounded-full opacity-75"
        style={{ 
          backgroundColor: primaryColor,
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
        }}
      />
      
      {/* Button */}
      <button
        onClick={onClick}
        className={cn(
          "relative flex items-center justify-center w-14 h-14 rounded-full shadow-lg",
          "hover:scale-110 active:scale-95 transition-all duration-200 text-white",
          "focus:outline-none focus:ring-2 focus:ring-offset-2"
        )}
        style={{ 
          backgroundColor: primaryColor,
          '--tw-ring-color': primaryColor
        } as React.CSSProperties}
        aria-label="Open chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    </div>
  );
};