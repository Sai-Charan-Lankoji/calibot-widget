"use client"

import  React, { useState } from "react"
import { Avatar } from "./ui/Avatar"
import { cn } from "../utils/cn";
import { Button } from "./ui/Button"
import { ChevronRight } from "lucide-react"

interface Question {
  id: string
  text: string
  type: "single" | "multiple" | "text"
  options?: string[]
}

interface ConversationalQuestionProps {
  question: Question
  onAnswer: (answer: string | string[]) => void
  isLoading?: boolean
}

export const ConversationalQuestion: React.FC<ConversationalQuestionProps> = ({
  question,
  onAnswer,
  isLoading = false,
}) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [textAnswer, setTextAnswer] = useState("")

  const handleOptionClick = (option: string) => {
    if (question.type === "single") {
      onAnswer(option)
    } else if (question.type === "multiple") {
      const newSelection = selectedOptions.includes(option)
        ? selectedOptions.filter(o => o !== option)
        : [...selectedOptions, option]
      setSelectedOptions(newSelection)
    }
  }

  const handleSubmit = () => {
    if (question.type === "multiple") {
      onAnswer(selectedOptions)
    } else if (question.type === "text") {
      onAnswer(textAnswer)
    }
  }

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
      {/* Question Text */}
      <div className="message-bubble message-bubble-bot shadow-sm">
        {question.text}
      </div>

      {/* Options or Input */}
      <div className="space-y-2">
        {question.type === "text" ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Type your answer..."
              disabled={isLoading}
              className="input flex-1"
            />
            <Button
              onClick={handleSubmit}
              disabled={!textAnswer.trim() || isLoading}
              isLoading={isLoading}
              size="md"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        ) : (
          <>
            {question.options?.map((option) => {
              const isSelected = selectedOptions.includes(option)
              return (
                <button
                  key={option}
                  onClick={() => handleOptionClick(option)}
                  disabled={isLoading}
                  className={`
                    w-full p-3 rounded-lg border-2 text-left
                    transition-all duration-200
                    ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border bg-card text-card-foreground hover:border-primary/50 hover:bg-muted"
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                    focus:outline-hidden focus:ring-2 focus:ring-ring
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{option}</span>
                    {isSelected && (
                      <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              )
            })}

            {question.type === "multiple" && selectedOptions.length > 0 && (
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                isLoading={isLoading}
                className="w-full"
              >
                Continue
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
