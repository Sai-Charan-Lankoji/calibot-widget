"use client"

import React, { useRef } from "react"
import type { WidgetConfig } from "@/types"
import { ChatInterface } from "./components/ChatInterface"
import { ToggleButton } from "./components/ToggleButton"
import { WelcomePopover } from './components/WelcomePopover';
import { WidgetErrorBoundary } from './components/ErrorBoundary';
import { useWidgetState } from './hooks/useWidgetState';
import "./theme-variables.css"

// ============================================================================
// LOADING STATE COMPONENT
// ============================================================================

interface LoadingStateProps {
  position: 'bottom-left' | 'bottom-right';
  widgetRef: React.RefObject<HTMLDivElement | null>;
}

const LoadingState: React.FC<LoadingStateProps> = ({ position, widgetRef }) => (
  <div
    ref={widgetRef}
    className={`cali-chat-widget fixed bottom-4 z-50 ${position === "bottom-left" ? "left-4" : "right-4"}`}
  >
    <div className="w-14 h-14 rounded-theme-avatar bg-theme-primary flex items-center justify-center animate-pulse">
      <div className="w-6 h-6 border-2 border-theme-primary-content border-t-transparent rounded-full animate-spin" />
    </div>
  </div>
);

// ============================================================================
// MAIN WIDGET COMPONENT
// ============================================================================

export function CaliChatWidget(props: WidgetConfig) {
  const widgetRef = useRef<HTMLDivElement>(null);
  
  const {
    isOpen,
    showWelcome,
    botConfig,
    isLoading,
    position,
    botName,
    welcomeMessage,
    avatarSrc,
    openWidget,
    closeWidget,
    dismissWelcome,
  } = useWidgetState({ config: props, widgetRef });

  // Show loading state
  if (isLoading) {
    return <LoadingState position={position} widgetRef={widgetRef} />;
  }

  return (
    <WidgetErrorBoundary>
      <div
        ref={widgetRef}
        className={`cali-chat-widget fixed bottom-4 z-50 ${position === "bottom-left" ? "left-4" : "right-4"}`}
      >
        {/* Chat Interface */}
        {isOpen && botConfig && (
          <div className="widget-animate-in mb-4">
            <ChatInterface
              botName={botName}
              welcomeMessage={welcomeMessage}
              avatarSrc={avatarSrc}
              apiBaseUrl={props.apiBaseUrl}
              botId={props.botId}
              onClose={closeWidget}
              botConfig={botConfig}
              featureChat={botConfig.feature_chat}
              featureUI={botConfig.feature_ui}
            />
          </div>
        )}

        {/* Toggle Button */}
        {!isOpen && (
          <ToggleButton 
            onClick={openWidget} 
            primaryColor={props.primaryColor} 
            avatarSrc={avatarSrc} 
          />
        )}
        
        {/* Welcome Popover - positioned relative to widget container */}
        {showWelcome && !isOpen && (
          <WelcomePopover
            message={welcomeMessage || "👋 Hi! How can we help you today?"}
            onClose={dismissWelcome}
            autoHideDuration={6000}
            position={position}
          />
        )}
      </div>
    </WidgetErrorBoundary>
  );
}
