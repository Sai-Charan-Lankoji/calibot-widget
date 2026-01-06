import { LiveChatSession } from '@/types';

// Session Storage Keys (cleared on tab close)
const SESSION_KEY = 'cali_live_chat_session';

// Local Storage Keys (persistent)
const VISITOR_ID_KEY = 'cali_visitor_id';
const VISITOR_PREFERENCES_KEY = 'cali_visitor_preferences';

export interface SessionData {
  sessionId: string;
  sessionToken: string;
  botId: string;
  visitorInfo: {
    name: string;
    email: string;
  };
  createdAt: string;
  lastActivity: string;
}

export interface VisitorPreferences {
  theme?: 'light' | 'dark';
  language?: string;
  notificationsDismissed?: string[];
}

// ==========================================
// SESSION STORAGE (Tab-Specific)
// ==========================================

export class SessionManager {
  /**
   * Get active session from sessionStorage
   */
  static get(): SessionData | null {
    try {
      const data = sessionStorage.getItem(SESSION_KEY);
      if (!data) return null;
      
      const session = JSON.parse(data) as SessionData;
      
      if (!session.sessionId || !session.sessionToken || !session.botId) {
        console.warn('⚠️ Invalid session structure, clearing...');
        this.clear();
        return null;
      }
      
      return session;
    } catch (error) {
      console.error('❌ Failed to parse session:', error);
      this.clear();
      return null;
    }
  }

  /**
   * Save session to sessionStorage
   */
  static set(session: SessionData): void {
    try {
      const dataToStore = {
        ...session,
        lastActivity: new Date().toISOString()
      };
      
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(dataToStore));
      
      console.log('✅ Session saved to sessionStorage:', {
        sessionId: session.sessionId,
        visitor: session.visitorInfo?.name || 'Anonymous',
        botId: session.botId
      });
    } catch (error) {
      console.error('❌ Failed to save session:', error);
      throw new Error('Failed to persist session');
    }
  }

  /**
   * Update session with partial data
   */
  static update(partial: Partial<SessionData>): void {
    const current = this.get();
    if (current) {
      this.set({ ...current, ...partial });
    }
  }

  /**
   * Clear session from sessionStorage
   */
  static clear(): void {
    try {
      sessionStorage.removeItem(SESSION_KEY);
      console.log('🗑️ Session cleared from sessionStorage');
    } catch (error) {
      console.error('❌ Failed to clear session:', error);
    }
  }

  /**
   * Check if active session exists
   */
  static hasActiveSession(): boolean {
    return this.get() !== null;
  }

  /**
   * Get session ID only
   */
  static getSessionId(): string | null {
    const session = this.get();
    return session?.sessionId || null;
  }

  /**
   * Get session token only
   */
  static getToken(): string | null {
    const session = this.get();
    return session?.sessionToken || null;
  }

  /**
   * Update visitor info in existing session
   */
  static updateVisitorInfo(visitorInfo: Partial<SessionData['visitorInfo']>): void {
    const session = this.get();
    if (session) {
      session.visitorInfo = { ...session.visitorInfo, ...visitorInfo };
      this.set(session);
    }
  }

  /**
   * Update last activity timestamp
   */
  static touchActivity(): void {
    const session = this.get();
    if (session) {
      session.lastActivity = new Date().toISOString();
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
  }
}

// ==========================================
// LOCAL STORAGE (Persistent Visitor Data)
// ==========================================

export class VisitorManager {
  /**
   * Get or create persistent visitor ID
   */
  static getOrCreateVisitorId(): string {
    try {
      let visitorId = localStorage.getItem(VISITOR_ID_KEY);
      
      if (!visitorId) {
        visitorId = crypto.randomUUID();
        localStorage.setItem(VISITOR_ID_KEY, visitorId);
        console.log('🆕 New visitor ID created:', visitorId);
      }
      
      return visitorId;
    } catch (error) {
      console.error('❌ Failed to get/create visitor ID:', error);
      return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  /**
   * Get visitor preferences
   */
  static getPreferences(): VisitorPreferences {
    try {
      const data = localStorage.getItem(VISITOR_PREFERENCES_KEY);
      if (!data) return {};
      
      return JSON.parse(data) as VisitorPreferences;
    } catch (error) {
      console.error('❌ Failed to parse visitor preferences:', error);
      return {};
    }
  }

  /**
   * Save visitor preferences
   */
  static setPreferences(preferences: VisitorPreferences): void {
    try {
      const current = this.getPreferences();
      const updated = { ...current, ...preferences };
      localStorage.setItem(VISITOR_PREFERENCES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('❌ Failed to save visitor preferences:', error);
    }
  }

  /**
   * Clear all visitor data
   */
  static clearAll(): void {
    try {
      localStorage.removeItem(VISITOR_ID_KEY);
      localStorage.removeItem(VISITOR_PREFERENCES_KEY);
      console.log('🗑️ All visitor data cleared from localStorage');
    } catch (error) {
      console.error('❌ Failed to clear visitor data:', error);
    }
  }
}

// ==========================================
// COMBINED HELPERS
// ==========================================

export class ChatStorageManager {
  /**
   * Initialize a new chat session
   */
  static initSession(data: {
    sessionId: string;
    sessionToken: string;
    botId: string;
    visitorInfo: { name: string; email: string };
  }): void {
    const sessionData: SessionData = {
      ...data,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };
    
    SessionManager.set(sessionData);
  }

  /**
   * Get complete session context
   */
  static getSessionContext(): {
    session: SessionData | null;
    visitorId: string;
    preferences: VisitorPreferences;
  } {
    return {
      session: SessionManager.get(),
      visitorId: VisitorManager.getOrCreateVisitorId(),
      preferences: VisitorManager.getPreferences()
    };
  }

  /**
   * End session and clean up
   */
  static endSession(clearVisitorData: boolean = false): void {
    SessionManager.clear();
    
    if (clearVisitorData) {
      VisitorManager.clearAll();
    }
  }

  /**
   * Check if user can resume session
   */
  static canResumeSession(): boolean {
    return SessionManager.hasActiveSession();
  }
}