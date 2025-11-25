import React from 'react';
import { Avatar } from './ui/Avatar';
import { cn } from '../utils/cn';

interface ConversationalQuestionProps {
  question: string;
  options: string[];
  avatarSrc?: string;
  botName: string;
  onSelectOption: (option: string) => void;
}

export const ConversationalQuestion: React.FC<ConversationalQuestionProps> = ({
  question,
  options,
  avatarSrc,
  botName,
  onSelectOption
}) => {
  return (
    <div className="flex items-start gap-2">
      <Avatar src={avatarSrc} fallback={botName} size="sm" />
      <div className="flex-1 space-y-2">
        {/* Question message */}
        <div className="bg-base-100 px-4 py-2.5 rounded-2xl rounded-bl-md shadow-sm border border-base max-w-[85%]">
          <p className="text-sm text-base-content">{question}</p>
        </div>
        
        {/* Option buttons */}
        <div className="space-y-1.5">
          {options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => onSelectOption(option)}
              className={cn(
                "w-fit text-left p-2 gap-2 rounded-lg text-xs",
                "bg-base-100 border border-base hover:border-primary/30",
                "hover:bg-base-200 transition-all",
                "focus:outline-none focus:ring-2 focus:ring-primary/20"
              )}
            >
              <span className="text-base-content font-medium">{option}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
