/**
 * Widget Constants
 * Centralized configuration values for consistent behavior across components
 */

// ============================================================================
// LAYOUT CONSTANTS
// ============================================================================

/** Widget positioning options */
export type WidgetPosition = 'bottom-left' | 'bottom-right';

/** Default position if not specified */
export const DEFAULT_POSITION: WidgetPosition = 'bottom-right';

/** Layout dimensions in pixels */
export const LAYOUT = {
  /** Toggle button dimensions */
  TOGGLE_BUTTON: {
    SIZE: 56,         // w-14, h-14
    ICON_SIZE: 28,    // w-7, h-7
    AVATAR_SIZE: 40,  // w-10, h-10
  },
  
  /** Chat window dimensions */
  CHAT_WINDOW: {
    WIDTH: 380,
    HEIGHT: 600,
    MIN_HEIGHT: 400,
    MAX_HEIGHT: 700,
  },
  
  /** Spacing values */
  SPACING: {
    WIDGET_MARGIN: 16,    // Distance from screen edge
    POPOVER_GAP: 18,      // Gap between toggle and popover
    CHAT_GAP: 16,         // Gap between toggle and chat window
  },
  
  /** Border radius values */
  RADIUS: {
    SMALL: 4,
    MEDIUM: 8,
    LARGE: 12,
    XL: 16,
    XXL: 24,
    FULL: 9999,
  },
} as const;

// ============================================================================
// TIMING CONSTANTS
// ============================================================================

export const TIMING = {
  /** Animation durations in ms */
  ANIMATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  },
  
  /** Delay values in ms */
  DELAY: {
    POPOVER_SHOW: 300,
    WELCOME_SHOW: 1000,
    MESSAGE_TYPING: 800,
    DEBOUNCE: 300,
  },
  
  /** Auto-hide durations in ms */
  AUTO_HIDE: {
    POPOVER: 6000,
    TOAST: 5000,
    ERROR: 8000,
  },
} as const;

// ============================================================================
// STORAGE KEYS
// ============================================================================

export const STORAGE_KEYS = {
  /** Session storage keys */
  SESSION: {
    WELCOME_SEEN: 'cali-chat-welcome-seen',
    SESSION_ID: 'cali-chat-session-id',
    VISITOR_ID: 'cali-chat-visitor-id',
    CONVERSATION_ID: 'cali-chat-conversation-id',
  },
  
  /** Local storage keys */
  LOCAL: {
    PREFERENCES: 'cali-chat-preferences',
    THEME_OVERRIDE: 'cali-chat-theme-override',
  },
} as const;

// ============================================================================
// API ENDPOINTS
// ============================================================================

export const API_ENDPOINTS = {
  BOT_THEME: (botId: string) => `/widget/bot/${botId}/theme`,
  CONVERSATIONS: '/conversations',
  MESSAGES: (conversationId: string) => `/conversations/${conversationId}/messages`,
  LIVE_CHAT: {
    CONNECT: '/socket.io',
    QUEUE: '/live-chat/queue',
  },
} as const;

// ============================================================================
// DEFAULT THEME
// ============================================================================

export const DEFAULT_COLORS = {
  primary: '#3B82F6',
  primaryContent: '#FFFFFF',
  secondary: '#64748B',
  secondaryContent: '#FFFFFF',
  accent: '#F59E0B',
  accentContent: '#FFFFFF',
  neutral: '#333333',
  neutralContent: '#FFFFFF',
  base100: '#FFFFFF',
  base200: '#F3F4F6',
  base300: '#E5E7EB',
  baseContent: '#1F2937',
  info: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
} as const;

export const DEFAULT_TYPOGRAPHY = {
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSizeBase: '14px',
  fontSizeSmall: '12px',
  fontSizeLarge: '16px',
  fontWeightNormal: 400,
  fontWeightMedium: 500,
  fontWeightBold: 600,
  lineHeight: 1.5,
} as const;

// ============================================================================
// MESSAGE CONSTANTS
// ============================================================================

export const MESSAGE = {
  /** Maximum lengths */
  MAX_LENGTH: {
    INPUT: 1000,
    PREVIEW: 100,
  },
  
  /** Message types */
  TYPES: {
    USER: 'user',
    BOT: 'bot',
    AGENT: 'agent',
    SYSTEM: 'system',
    ACTION: 'action-buttons',
    QUESTION: 'conversational-question',
  },
} as const;

// ============================================================================
// VALIDATION
// ============================================================================

export const VALIDATION = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[\d\s\-+()]{7,20}$/,
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
  },
} as const;

// ============================================================================
// Z-INDEX LAYERS
// ============================================================================

export const Z_INDEX = {
  WIDGET_CONTAINER: 2147483647, // Maximum z-index for CDN widget
  CHAT_WINDOW: 9999,
  POPOVER: 9998,
  OVERLAY: 9997,
  TOOLTIP: 10000,
} as const;
