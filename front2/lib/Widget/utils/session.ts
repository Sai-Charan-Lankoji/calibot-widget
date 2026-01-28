import { ChatSession } from "@/types";
import { logger } from './logger';

const SESSION_KEY = "cali_chat_session";
const SESSION_TIMEOUT_HOURS = 24;

export class SessionManager {
  /**
   * Get active session from sessionStorage
   * Returns null if session is expired or invalid
   */
  static get(): ChatSession | null {
    try {
      const data = sessionStorage.getItem(SESSION_KEY);
      if (!data) return null;

      const session = JSON.parse(data) as ChatSession;

      // Validate session structure
      if (!session.sessionToken || !session.sessionId || !session.createdAt) {
        console.warn("Invalid session structure, clearing...");
        this.clear();
        return null;
      }

      // Check expiration (24 hours)
      const createdAt = new Date(session.createdAt);
      const now = new Date();
      const hoursDiff =
        (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

      if (hoursDiff > SESSION_TIMEOUT_HOURS) {
        logger.log(
          `Session expired (${hoursDiff.toFixed(
            1
          )}h > ${SESSION_TIMEOUT_HOURS}h), clearing...`
        );
        this.clear();
        return null;
      }

      return session;
    } catch (error) {
      console.error("Failed to parse session:", error);
      this.clear();
      return null;
    }
  }

  /**
   * Save session to sessionStorage
   */
  static set(session: ChatSession): void {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      logger.log("✅ Session saved:", {
        sessionId: session.sessionId,
        visitor: session.visitorInfo?.name || "Anonymous",
      });
    } catch (error) {
      console.error("Failed to save session:", error);
      throw new Error("Failed to persist session");
    }
  }

  /**
   * Clear session from sessionStorage
   */
  static clear(): void {
    try {
      sessionStorage.removeItem(SESSION_KEY);
      logger.log("🗑️ Session cleared");
    } catch (error) {
      console.error("Failed to clear session:", error);
    }
  }

  /**
   * Check if active session exists
   */
  static hasActiveSession(): boolean {
    return this.get() !== null;
  }

  /**
   * Get session token only
   */
  static getSessionToken(): string | null {
    const session = this.get();
    return session?.sessionToken || null;
  }

  /**
   * Get session ID only
   */
  static getSessionId(): string | null {
    const session = this.get();
    return session?.sessionId || null;
  }

  /**
   * Update visitor info in existing session
   */
  static updateVisitorInfo(
    visitorInfo: Partial<ChatSession["visitorInfo"]>
  ): void {
    const session = this.get();
    if (session) {
      session.visitorInfo = {
        ...session.visitorInfo,
        ...visitorInfo,
      };
      this.set(session);
    }
  }
}
