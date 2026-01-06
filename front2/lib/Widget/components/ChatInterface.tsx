"use client"

import React, { useState, useEffect, useRef, useCallback, useOptimistic, useTransition } from "react"
import { X, Send } from "lucide-react"
import type { Conversation, VisitorInfo, BotConfiguration } from "@/types"
import { cn } from "../utils/cn"
import * as ScrollArea from "@radix-ui/react-scroll-area"
import { Avatar } from "./ui/Avatar"
import { Button } from "./ui/Button"
import { ConversationalQuestion } from "./ConversationalQuestion"
import { type ThemeConfig, applyThemeToElement, extractThemeFromBot, DEFAULT_THEME } from "../utils/theme-manager"
// import "../theme-variables.css"

import "../globals.css"

type BubbleMessage = {
  id: string
  type: "bot" | "user" | "action-buttons" | "agent" | "conversational-question"
  content: string
  timestamp: string
  actions?: Array<{ label: string; onClick: () => void }>
  question?: string
  options?: string[]
  currentRank?: number
  isPending?: boolean
  agentName?: string
}

type ChatStep = "welcome" | "asking-name" | "asking-email" | "chatting"

interface ChatInterfaceProps {
  botName: string
  welcomeMessage?: string
  avatarSrc?: string
  apiBaseUrl: string
  botId: string
  onClose: () => void
  botConfig?: BotConfiguration
  featureChat?: any
  featureUI?: any
}

const UserMessage = React.memo<{ content: string; isPending?: boolean }>(({ content, isPending }) => (
  <div className="flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-300">
    <div
      className={cn(
        "max-w-[80%] bg-theme-primary text-theme-primary-content px-4 py-3 rounded-2xl rounded-br-md shadow-lg",
        isPending && "opacity-60 animate-pulse",
      )}
    >
      <p className="text-sm font-medium leading-relaxed">{content}</p>
    </div>
  </div>
))
UserMessage.displayName = "UserMessage"

const BotMessage = React.memo<{ content: string; avatarSrc?: string; botName: string }>(
  ({ content, avatarSrc, botName }) => (
    <div className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Avatar src={avatarSrc} fallback={botName} size="sm" className="shrink-0 mt-1" />
      <div className="max-w-[85%] bg-theme-base-100 px-4 py-3 rounded-2xl rounded-bl-md shadow-md border border-theme-base">
        <p className="text-sm text-theme-base-content whitespace-pre-wrap leading-relaxed">{content}</p>
      </div>
    </div>
  ),
)
BotMessage.displayName = "BotMessage"

const AgentMessage = React.memo<{ content: string; agentName?: string }>(({ content, agentName }) => (
  <div className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
    <div className="w-8 h-8 rounded-full bg-theme-accent text-theme-primary-content flex items-center justify-center text-xs font-bold ring-2 ring-theme-base-100 shadow-md">
      {agentName?.charAt(0) || "A"}
    </div>
    <div className="max-w-[85%] bg-theme-base-100 px-4 py-3 rounded-2xl rounded-bl-md shadow-md border border-theme-accent">
      <p className="text-xs font-semibold text-theme-accent mb-1">{agentName || "Support Agent"}</p>
      <p className="text-sm text-theme-base-content whitespace-pre-wrap leading-relaxed">{content}</p>
    </div>
  </div>
))
AgentMessage.displayName = "AgentMessage"

const ActionButtons = React.memo<{
  actions: Array<{ label: string; onClick: () => void }>
  avatarSrc?: string
}>(({ actions, avatarSrc }) => (
  <div className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
    {avatarSrc && <div className="w-8 shrink-0" />}
    <div className="flex flex-wrap gap-2.5">
      {actions.map((action, idx) => (
        <Button
          key={idx}
          variant="outline"
          size="sm"
          onClick={action.onClick}
          className="rounded-full px-4 py-2 transition-all duration-200 hover:opacity-80 bg-theme-base-200 border border-theme-base text-theme-base-content"
        >
          {action.label}
        </Button>
      ))}
    </div>
  </div>
))
ActionButtons.displayName = "ActionButtons"

const TypingIndicator = React.memo<{ avatarSrc?: string; botName: string }>(({ avatarSrc, botName }) => (
  <div className="flex items-start gap-3 widget-fade-in animate-in fade-in slide-in-from-bottom-2 duration-300">
    <Avatar src={avatarSrc} fallback={botName} size="sm" className="shrink-0" />
    <div className="bg-theme-base-100 px-4 py-3 rounded-2xl rounded-bl-md shadow-md border border-theme-base">
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 bg-theme-neutral rounded-full animate-bounce [animation-delay:-0.3s]" />
        <span className="w-2 h-2 bg-theme-neutral rounded-full animate-bounce [animation-delay:-0.15s]" />
        <span className="w-2 h-2 bg-theme-neutral rounded-full animate-bounce" />
      </div>
    </div>
  </div>
))
TypingIndicator.displayName = "TypingIndicator"

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  botName,
  welcomeMessage,
  avatarSrc,
  apiBaseUrl,
  botId,
  onClose,
  botConfig,
  featureChat,
  featureUI,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [messages, setMessages] = useState<BubbleMessage[]>([])
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(messages, (state, newMessage: BubbleMessage) => [
    ...state,
    { ...newMessage, isPending: true },
  ])

  const [inputText, setInputText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [currentStep, setCurrentStep] = useState<ChatStep>("welcome")
  const [visitorInfo, setVisitorInfo] = useState<Partial<VisitorInfo>>({})
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<any>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const timersRef = useRef<Set<number>>(new Set())
  const abortControllerRef = useRef<AbortController | null>(null)
  const [isPending, startTransition] = useTransition()
  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME)

  const genId = useCallback(() => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, [])

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer))
      timersRef.current.clear()
      abortControllerRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [optimisticMessages, scrollToBottom])

  const setManagedTimeout = useCallback((fn: () => void, delay: number) => {
    const timer = window.setTimeout(() => {
      fn()
      timersRef.current.delete(timer)
    }, delay)
    timersRef.current.add(timer)
    return timer
  }, [])

  const addBotMessage = useCallback(
    (content: string, type: BubbleMessage["type"] = "bot", extraData?: Partial<BubbleMessage>) => {
      const msg: BubbleMessage = {
        id: genId(),
        type,
        content,
        timestamp: new Date().toISOString(),
        ...extraData,
      }
      setMessages((prev) => [...prev, msg])
    },
    [genId],
  )

  const addUserMessage = useCallback(
    (content: string) => {
      const msg: BubbleMessage = {
        id: genId(),
        type: "user",
        content,
        timestamp: new Date().toISOString(),
      }

      addOptimisticMessage(msg)

      startTransition(() => {
        setMessages((prev) => [...prev, msg])
      })
    },
    [genId, addOptimisticMessage],
  )

  const handleContactSupport = useCallback(() => {
    addUserMessage("I want to contact support")
    setCurrentStep("asking-name")
    setIsTyping(true)

    setManagedTimeout(() => {
      setIsTyping(false)
      addBotMessage("I'd be happy to connect you with our team! First, what's your name?", "bot")
    }, 600)
  }, [addUserMessage, setManagedTimeout, addBotMessage])

  const handleOptionSelect = useCallback(
    async (option: string) => {
      if (!currentQuestion) return

      addUserMessage(option)
      setIsTyping(true)

      try {
        const response = await fetch(`${apiBaseUrl}/api/chat/${botId}/message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            selected_option: option,
            current_rank: currentQuestion.rank,
          }),
        })

        if (!response.ok) throw new Error("Failed to send message")

        const data = await response.json()
        setIsTyping(false)

        if (data.acknowledged) {
          addBotMessage(data.acknowledged, "bot")
        }

        if (data.next_question) {
          setCurrentQuestion(data.next_question)
          setManagedTimeout(() => {
            addBotMessage("", "conversational-question", {
              question: data.next_question.question,
              options: data.next_question.options,
              currentRank: data.next_question.rank,
            })
          }, 400)
        } else if (data.end) {
          setManagedTimeout(() => {
            addBotMessage(data.message || "Thank you for your responses!", "bot")
          }, 300)

          // Show transfer to human option if flagged
          if (data.transfer_to_human) {
            setManagedTimeout(() => {
              addBotMessage("", "action-buttons", {
                actions: [
                  { label: "👤 Yes, connect me with a specialist", onClick: handleContactSupport },
                  { label: "🔄 Start Over", onClick: handleRestart },
                ],
              })
            }, 800)
          } else {
            setManagedTimeout(() => {
              addBotMessage("", "action-buttons", {
                actions: [{ label: "🔄 Start Over", onClick: handleRestart }],
              })
            }, 500)
          }
        }
      } catch (error) {
        console.error("Option selection error:", error)
        setIsTyping(false)
        addBotMessage("Sorry, something went wrong. Please try again.", "bot")
      }
    },
    [currentQuestion, addUserMessage, apiBaseUrl, botId, addBotMessage, setManagedTimeout, handleContactSupport],
  )

  const handleRestart = useCallback(async () => {
    setMessages([])
    setCurrentStep("welcome")
    setIsTyping(true)
    setCurrentQuestion(null)

    try {
      const response = await fetch(`${apiBaseUrl}/api/chat/${botId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) throw new Error("Failed to restart chat")

      const data = await response.json()
      setIsTyping(false)

      const welcomeMsg: BubbleMessage = {
        id: genId(),
        type: "bot",
        content: data.greeting || welcomeMessage || `Hi! I'm ${botName}`,
        timestamp: new Date().toISOString(),
      }

      setMessages([welcomeMsg])

      if (data.has_questions && data.next_question) {
        setCurrentQuestion(data.next_question)
        setManagedTimeout(() => {
          addBotMessage("", "conversational-question", {
            question: data.next_question.question,
            options: data.next_question.options || [],
            currentRank: data.next_question.rank,
          })
        }, 400)
      }
    } catch (error: any) {
      console.error("Restart chat error:", error)
      setIsTyping(false)
      addBotMessage("Sorry, could not restart. Please try again.", "bot",)
    }
  }, [apiBaseUrl, botId, genId, welcomeMessage, botName, addBotMessage, setManagedTimeout])

  const initializedRef = useRef(false)

  useEffect(() => {
    const initializeChat = async () => {
      if (initializedRef.current) return
      initializedRef.current = true

      try {
        console.log("🚀 Initializing conversational chat...")

        const response = await fetch(`${apiBaseUrl}/api/chat/${botId}/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })

        if (!response.ok) {
          throw new Error("Failed to start chat")
        }

        const data = await response.json()
        console.log("✅ Chat initialized:", data)

        const welcomeMsg: BubbleMessage = {
          id: genId(),
          type: "bot",
          content: data.greeting || welcomeMessage || `Hi! I'm ${botName}`,
          timestamp: new Date().toISOString(),
        }

        setManagedTimeout(() => setMessages([welcomeMsg]), 200)

        if (data.has_questions && data.next_question) {
          setCurrentQuestion(data.next_question)

          setManagedTimeout(() => {
            const questionMsg: BubbleMessage = {
              id: genId(),
              type: "conversational-question",
              content: "",
              question: data.next_question.question,
              options: data.next_question.options || [],
              currentRank: data.next_question.rank,
              timestamp: new Date().toISOString(),
            }
            setMessages((prev) => [...prev, questionMsg])
          }, 500)
        } else {
          setManagedTimeout(() => {
            addBotMessage("", "action-buttons", {
              actions: [{ label: "💬 Contact Support", onClick: handleContactSupport }],
            })
          }, 500)
        }
      } catch (error) {
        console.error("❌ Failed to initialize chat:", error)
        initializedRef.current = false // Allow retry on error

        const welcomeMsg: BubbleMessage = {
          id: genId(),
          type: "bot",
          content: welcomeMessage || `Hi! I'm ${botName}. How can I help?`,
          timestamp: new Date().toISOString(),
        }

        setManagedTimeout(() => {
          setMessages([welcomeMsg])
          addBotMessage("", "action-buttons", {
            actions: [{ label: "💬 Contact Support", onClick: handleContactSupport }],
          })
        }, 200)
      }
    }

    initializeChat()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleNameSubmit = useCallback(() => {
    if (!inputText.trim()) return

    const name = inputText.trim()

    startTransition(() => {
      setVisitorInfo((prev) => ({ ...prev, name }))
      addUserMessage(name)
      setInputText("")
      setCurrentStep("asking-email")
      setIsTyping(true)

      setManagedTimeout(() => {
        setIsTyping(false)
        addBotMessage(`Nice to meet you, ${name}! What's your email address?`, "bot")
      }, 600)
    })
  }, [inputText, addUserMessage, setManagedTimeout, addBotMessage])

  const handleEmailSubmit = useCallback(async () => {
    if (!inputText.trim()) return

    const email = inputText.trim()
    const fullVisitorInfo: VisitorInfo = { name: visitorInfo.name!, email }

    const optimisticMsg: BubbleMessage = {
      id: genId(),
      type: "user",
      content: email,
      timestamp: new Date().toISOString(),
    }

    addOptimisticMessage(optimisticMsg)
    setInputText("")
    setIsTyping(true)

    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch(`${apiBaseUrl}/api/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          botId,
          visitor_info: fullVisitorInfo,
          channel: "website",
          attributes: {
            current_page_url: window.location.href,
            referrer_url: document.referrer,
            user_agent: navigator.userAgent,
          },
        }),
      })

      if (!response.ok) throw new Error("Failed to start conversation")

      const data = await response.json()

      startTransition(() => {
        setMessages((prev) => [...prev, optimisticMsg])
        setConversation(data.conversation)
        setSessionToken(data.sessionToken)
        setVisitorInfo(fullVisitorInfo)

        localStorage.setItem(
          `cali_chat_${botId}`,
          JSON.stringify({
            conversationId: data.conversation.id,
            sessionToken: data.sessionToken,
            visitorInfo: fullVisitorInfo,
            expiresAt: Date.now() + 24 * 60 * 60 * 1000,
          }),
        )

        setIsTyping(false)
        setCurrentStep("chatting")
        addBotMessage("Perfect! You're now connected. How can I help you?", "bot")
      })
    } catch (error: any) {
      if (error.name === "AbortError") return
      startTransition(() => {
        setMessages((prev) => [...prev, optimisticMsg])
        setIsTyping(false)
        addBotMessage("Sorry, something went wrong. Please try again.", "bot")
      })
    }
  }, [inputText, visitorInfo, genId, addOptimisticMessage, apiBaseUrl, botId, addBotMessage])

  const handleChatMessage = useCallback(async () => {
    if (!inputText.trim() || !conversation || !sessionToken) return

    const userMsg = inputText.trim()

    const optimisticMsg: BubbleMessage = {
      id: genId(),
      type: "user",
      content: userMsg,
      timestamp: new Date().toISOString(),
    }

    addOptimisticMessage(optimisticMsg)
    setInputText("")
    setIsTyping(true)

    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch(`${apiBaseUrl}/api/conversations/${conversation.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          content: { text: userMsg },
          sender_type: "USER",
        }),
      })

      if (!response.ok) throw new Error("Failed to send message")

      const data = await response.json()

      startTransition(() => {
        setMessages((prev) => [...prev, optimisticMsg])
        setIsTyping(false)

        if (data.botResponse) {
          addBotMessage(data.botResponse.content.text, "bot")
        }
      })
    } catch (error: any) {
      if (error.name === "AbortError") return
      startTransition(() => {
        setMessages((prev) => [...prev, optimisticMsg])
        setIsTyping(false)
        addBotMessage("Sorry, something went wrong. Please try again.", "bot")
      })
    }
  }, [inputText, conversation, sessionToken, genId, addOptimisticMessage, apiBaseUrl, addBotMessage])

  useEffect(() => {
    if (currentStep !== "chatting" || !conversation) return

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/conversations/${conversation.id}/messages`)
        if (!response.ok) return

        const data = await response.json()
        const allMessages = data.messages || []

        startTransition(() => {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id))
            const newMessages = allMessages.filter(
              (m: any) => !existingIds.has(m.id) && (m.sender_type === "AGENT" || m.sender_type === "BOT"),
            )

            if (newMessages.length === 0) return prev

            const newBubbles = newMessages.map((m: any) => ({
              id: m.id,
              type: m.sender_type === "AGENT" ? "agent" : "bot",
              content: m.content?.text || "",
              timestamp: m.created_at,
              agentName: m.sender_name,
            }))

            return [...prev, ...newBubbles]
          })
        })
      } catch (error) {
        console.error("Polling error:", error)
      }
    }, 2000)

    return () => clearInterval(pollInterval)
  }, [currentStep, conversation, apiBaseUrl])

  const handleSendMessage = useCallback(() => {
    switch (currentStep) {
      case "asking-name":
        handleNameSubmit()
        break
      case "asking-email":
        handleEmailSubmit()
        break
      case "chatting":
        handleChatMessage()
        break
    }
  }, [currentStep, handleNameSubmit, handleEmailSubmit, handleChatMessage])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  useEffect(() => {
    if (botConfig) {
      const extractedTheme = extractThemeFromBot(botConfig)
      setTheme(extractedTheme)

      if (containerRef.current) {
        applyThemeToElement(containerRef.current, extractedTheme)
      }
    }
  }, [botConfig])

  return (
    <div
      ref={containerRef}
      className={cn(
        "cali-chat-widget w-[380px] h-[600px] rounded-2xl bg-theme-base-100 shadow-2xl flex flex-col overflow-hidden border border-theme-base-300",
        featureUI?.darkMode && "dark"
      )}
      style={{
        fontFamily: theme.typography.fontFamily as string,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-theme-base bg-theme-primary">
        <div className="flex items-center gap-3">
          <Avatar src={avatarSrc} fallback={botName} size="md" />
          <div>
            <h2 className="font-semibold text-theme-primary-content">{botName}</h2>
            {isTyping && <p className="text-xs text-theme-primary-content opacity-80">typing...</p>}
          </div>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors" aria-label="Close chat">
          <X className="w-5 h-5 text-theme-primary-content" />
        </button>
      </div>

      {/* Messages Container */}
      <ScrollArea.Root className="flex-1 overflow-hidden">
        <ScrollArea.Viewport className="w-full h-full">
          <div className="flex flex-col gap-4 p-4">
            {optimisticMessages.map((msg) => {
              switch (msg.type) {
                case "user":
                  return <UserMessage key={msg.id} content={msg.content} isPending={msg.isPending} />
                case "bot":
                  return <BotMessage key={msg.id} content={msg.content} avatarSrc={avatarSrc} botName={botName} />
                case "action-buttons":
                  return <ActionButtons key={msg.id} actions={msg.actions || []} avatarSrc={avatarSrc} />
                case "agent":
                  return <AgentMessage key={msg.id} content={msg.content} agentName={msg.agentName} />
                case "conversational-question":
                  return (
                    <ConversationalQuestion
                      key={msg.id}
                      question={msg.question || ""}
                      options={msg.options || []}
                      avatarSrc={avatarSrc}
                      botName={botName}
                      onSelectOption={handleOptionSelect}
                    />
                  )
                default:
                  return null
              }
            })}
            {isTyping && featureChat?.showTypingIndicator !== false && <TypingIndicator avatarSrc={avatarSrc} botName={botName} />}
            <div ref={scrollRef} />
          </div>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar orientation="vertical" className="w-2" />
      </ScrollArea.Root>

      {/* Input Area - Only show when user input is needed */}
      {currentStep !== "welcome" && (
        <div className="border-t border-theme-base bg-theme-base-100 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                currentStep === "asking-name"
                  ? "Enter your name..."
                  : currentStep === "asking-email"
                    ? "Enter your email..."
                    : "Type your message..."
              }
              className="flex-1 px-4 py-2 rounded-lg bg-theme-base-200 border border-theme-base focus:outline-none focus:ring-2 focus:ring-theme-primary text-theme-base-content placeholder:text-theme-neutral disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isTyping || isPending}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!inputText.trim() || isTyping || isPending} 
              className="px-4 py-2"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
