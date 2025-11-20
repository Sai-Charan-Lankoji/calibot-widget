import React from "react";
import ReactDOM from "react-dom/client";
import { CaliChatWidget } from "./Widget/CaliChatWidget";
import type { WidgetConfig } from "./types";
import "./Widget/globals.css";

// Ensure we're in a browser environment
if (typeof window === 'undefined') {
    throw new Error('CaliChatWidget can only be used in a browser environment');
}

// Function to inject CSS into the page
function injectStyles() {
    if (document.getElementById('cali-chat-widget-styles')) {
        return;
    }
    console.log('✅ Cali Chat Widget styles loaded');
}

// Initialize function
function init(config: WidgetConfig & { containerId?: string }) {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        console.error('CaliChatWidget requires a browser environment');
        return;
    }

    const { containerId, ...widgetConfig } = config;
    
    // Inject styles
    injectStyles();
    
    // Create container if containerId not provided
    let container = document.getElementById(containerId || "cali-chat-widget-root");
    
    if (!container) {
        container = document.createElement("div");
        container.id = containerId || "cali-chat-widget-root";
        document.body.appendChild(container);
    }

    try {
        const root = ReactDOM.createRoot(container);
        root.render(React.createElement(CaliChatWidget, widgetConfig));
        console.log('✅ Cali Chat Widget initialized successfully!');
    } catch (error) {
        console.error('❌ Failed to initialize Cali Chat Widget:', error);
    }
}

// Export the API
export const CaliChatWidgetAPI = {
    init
};

// Expose to window for UMD builds
if (typeof window !== 'undefined') {
    (window as any).CaliChatWidget = CaliChatWidgetAPI;
}

// TypeScript declaration
declare global {
    interface Window {
        CaliChatWidget: {
            init: (config: WidgetConfig & { containerId?: string }) => void;
        };
    }
}

// Auto-initialize if config is provided via data attributes
if (typeof document !== 'undefined') {
    const initFromDataAttributes = () => {
        const script = document.querySelector('script[data-bot-id]') as HTMLScriptElement;
        if (script) {
            const config: WidgetConfig = {
                botId: script.getAttribute('data-bot-id') || '',
                apiBaseUrl: script.getAttribute('data-api-url') || '',
                primaryColor: script.getAttribute('data-primary-color') || undefined,
                botName: script.getAttribute('data-bot-name') || undefined,
                welcomeMessage: script.getAttribute('data-welcome-message') || undefined,
                position: (script.getAttribute('data-position') as any) || 'bottom-right'
            };
            
            if (config.botId && config.apiBaseUrl) {
                init(config);
            }
        }
    };

    // Try to init on DOMContentLoaded or immediately if already loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFromDataAttributes);
    } else {
        initFromDataAttributes();
    }
}