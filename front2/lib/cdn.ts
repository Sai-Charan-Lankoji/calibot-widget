import React from "react";
import ReactDOM from "react-dom/client";
import { CaliChatWidget } from "./Widget/CaliChatWidget";
import type { WidgetConfig } from "./types";
import "./Widget/globals.css";

// Ensure we're in a browser environment
if (typeof window === 'undefined') {
    throw new Error('CaliChatWidget can only be used in a browser environment');
}

// Initialize function
function init(config: WidgetConfig & { containerId?: string }) {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        console.error('CaliChatWidget requires a browser environment');
        return;
    }

    const { containerId, ...widgetConfig } = config;
    
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
        const scripts = document.querySelectorAll('script[data-bot-id]');
        scripts.forEach((script) => {
            const htmlScript = script as HTMLScriptElement;
            const config: WidgetConfig = {
                botId: htmlScript.getAttribute('data-bot-id') || '',
                apiBaseUrl: htmlScript.getAttribute('data-widget-url') || '',
                primaryColor: htmlScript.getAttribute('data-primary-color') || undefined,
                botName: htmlScript.getAttribute('data-bot-name') || undefined,
                welcomeMessage: htmlScript.getAttribute('data-welcome-message') || undefined,
                position: (htmlScript.getAttribute('data-position') as any) || 'bottom-right',
                avatarSrc: htmlScript.getAttribute('data-avatar-src') || undefined,
                useFavicon: htmlScript.getAttribute('data-use-favicon') !== 'false' // Defaults to true
            };
            
            if (config.botId && config.apiBaseUrl) {
                init(config);
            }
        });
    };

    // Try to init on DOMContentLoaded or immediately if already loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFromDataAttributes);
    } else {
        initFromDataAttributes();
    }
}