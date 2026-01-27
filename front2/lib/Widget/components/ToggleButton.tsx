// import React from "react";
// import { MessageCircle } from "lucide-react";
// import { cn } from "../utils/cn";

// interface ToggleButtonProps {
//   onClick: () => void;
//   primaryColor?: string;
// }

// export const ToggleButton: React.FC<ToggleButtonProps> = ({ onClick }) => {
//   return (
//     <div className="relative">
//       <div className="absolute inset-0 rounded-full bg-primary opacity-75 animate-ping" />
//       <button
//         onClick={onClick}
//         className={cn(
//           "relative flex items-center justify-center w-14 h-14 rounded-full shadow-lg",
//           "bg-primary text-primary-content",
//           "hover:scale-110 active:scale-95 transition-all duration-200",
//           "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
//         )}
//         aria-label="Open chat"
//       >
//         <MessageCircle className="w-6 h-6" />
//       </button>
//     </div>
//   );
// };
"use client"

import type React from "react"
import { MessageCircle } from "lucide-react"
import { cn } from "../utils/cn";

interface ToggleButtonProps {
  onClick: () => void
  primaryColor?: string
  avatarSrc?: string
  isLoading?: boolean
}

export const ToggleButton: React.FC<ToggleButtonProps> = ({
  onClick,
  avatarSrc,
  isLoading = false,
}) => {
  const hasAvatar = Boolean(avatarSrc);

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={cn(
        "relative flex items-center justify-center w-14 h-14 rounded-theme-avatar shadow-lg transition-all duration-200",
        "hover:scale-110 active:scale-95",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-primary",
        "disabled:opacity-50 disabled:cursor-not-allowed",

        // 🎨 Conditional styling depending on avatar presence
        hasAvatar
          ? "bg-white border-2 border-theme-primary" // Clean avatar mode
          : "bg-theme-primary text-theme-primary-content" // Default themed mode
      )}
      aria-label="Open chat"
    >
      {isLoading ? (
        <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : hasAvatar ? (
        <img
          src={avatarSrc}
          alt="Chat avatar"
          className="w-10 h-10 rounded-theme-avatar object-cover"
        />
      ) : (
        <MessageCircle className="w-7 h-7" />
      )}

      {/* Pulse animation — disabled for avatar to avoid covering image */}
      {!hasAvatar && (
        <div className="absolute inset-0 rounded-theme-avatar bg-theme-primary opacity-40 animate-ping pointer-events-none" />
      )}
    </button>
  );
};
