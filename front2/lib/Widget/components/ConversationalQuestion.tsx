"use client"

import type React from "react"
import { Avatar } from "./ui/Avatar"
import { cn } from "../utils/cn";


interface ConversationalQuestionProps {
  question: string
  options: string[]
  avatarSrc?: string
  botName: string
  onSelectOption: (option: string) => void
}

export const ConversationalQuestion: React.FC<ConversationalQuestionProps> = ({
  question,
  options,
  avatarSrc,
  botName,
  onSelectOption,
}) => {
  return (
    <div className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <Avatar src={avatarSrc} fallback={botName} size="sm" className="mt-1 shrink-0" />
      <div className="flex-1 space-y-3 min-w-0">
        {/* Question message */}
        <div className="bg-theme-primary/10 px-4 py-3 rounded-theme-bubble rounded-tl-md border border-theme-primary/20 shadow-sm">
          <p className="text-sm font-medium text-theme-base-content leading-relaxed">{question}</p>
        </div>

        {/* Option buttons - Modern pill-style interactive options with hover effects */}
        <div className="flex flex-wrap gap-2 mt-3">
  {options.map((option, idx) => (
    <button
      key={idx}
      
      onClick={() => onSelectOption(option)}
      className={cn(
        "px-3 py-2 rounded-xl transition-all duration-200",
        "bg-theme-base-100 border border-theme-base hover:border-theme-primary/40 hover:bg-theme-primary/5",
        "hover:shadow-md hover:-translate-y-0.5",
        "focus:outline-none focus:ring-2 focus:ring-theme-primary focus:ring-offset-2",
        "group flex items-center",
        "whitespace-nowrap",      
        "active:scale-98"
      )}
    >
      <span className="text-sm font-medium text-theme-base-content group-hover:text-theme-primary transition-colors">
        {option}
      </span>
    </button>
  ))}
</div>
      </div>
    </div>
  )
}
