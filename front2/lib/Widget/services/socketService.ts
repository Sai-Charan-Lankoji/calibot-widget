// front2/lib/Widget/services/socketService.ts
import io, { Socket } from 'socket.io-client';
import { logger } from '../utils/logger';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, ((...args: any[]) => void)[]> = new Map();
  private connectionUrl: string = '';

  connect(url?: string): Promise<Socket> {
    // Use provided URL or fall back to stored one
    const targetUrl = url || this.connectionUrl;
    
    if (!targetUrl) {
      return Promise.reject(new Error('No socket URL provided'));
    }

    // Store the URL for reconnections
    if (url) {
      this.connectionUrl = url;
    }

    // Check if already connected to the same URL
    if (this.socket?.connected && this.connectionUrl === targetUrl) {
      return Promise.resolve(this.socket);
    }

    // Disconnect existing socket if URL changed
    if (this.socket && this.connectionUrl !== targetUrl) {
      this.disconnect();
    }

    return new Promise((resolve, reject) => {
      try {
        logger.log('🔌 [VISITOR] Socket connecting to:', targetUrl);
        
        this.socket = io(targetUrl, {
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
          transports: ['websocket', 'polling'],
          extraHeaders: {
            'ngrok-skip-browser-warning': 'true'
          }
        });

        this.socket.on('connect', () => {
          logger.log('✅ [VISITOR] Socket connected:', this.socket?.id);
          logger.log('📍 [VISITOR] Connected to:', targetUrl);
          logger.log('🔄 [VISITOR] Transport:', this.socket?.io?.engine?.transport?.name);
          resolve(this.socket!);
        });

        this.socket.on('disconnect', () => {
          logger.log('❌ [VISITOR] Socket disconnected');
        });

        this.socket.on('connect_error', (error) => {
          console.error('🔴 [VISITOR] Socket connection error:', error);
          reject(error);
        });
      } catch (error) {
        console.error('🔴 [VISITOR] Socket creation error:', error);
        reject(error);
      }
    });
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // ===== VISITOR EVENTS =====
  initiateChat(botId: string, tenantId: string, visitorName: string, visitorEmail: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit(
        'visitor:initiate_chat',
        { botId, tenantId, visitorName, visitorEmail },
        (response: any) => {
          if (response.success) {
            resolve(response.session_id);
          } else {
            reject(new Error(response.error));
          }
        }
      );
    });
  }

  sendMessage(sessionId: string, message: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit(
        'visitor:send_message',
        { sessionId, message },
        (response: any) => {
          if (response.success) {
            resolve(response.message_id);
          } else {
            reject(new Error(response.error));
          }
        }
      );
    });
  }

  // Join a specific session room so visitor receives messages from agents
  joinSessionRoom(sessionId: string, sessionToken: string): void {
    if (!this.socket) return;
    
    logger.log(`🔗 Joining session room: session:${sessionId}`);
    this.socket.emit('visitor:join_session', { sessionId, sessionToken }, (response: any) => {
      if (response.success) {
        logger.log(`✅ Successfully joined session room`);
      } else {
        console.error(`❌ Failed to join session room:`, response.error);
      }
    });
  }

  // ===== AGENT EVENTS =====
  registerAgent(agentId: string, tenantId: string) {
    if (!this.socket) return;

    return new Promise((resolve, reject) => {
      this.socket!.emit('agent:register', { agentId, tenantId }, (response: any) => {
        if (response.success) {
          resolve(true);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  acceptChat(agentId: string, sessionId: string, tenantId: string) {
    if (!this.socket) return;

    return new Promise((resolve, reject) => {
      this.socket!.emit(
        'agent:accept_chat',
        { agentId, sessionId, tenantId },
        (response: any) => {
          if (response.success) {
            resolve(true);
          } else {
            reject(new Error(response.error));
          }
        }
      );
    });
  }

  sendAgentMessage(agentId: string, sessionId: string, message: string) {
    if (!this.socket) return;

    return new Promise((resolve, reject) => {
      this.socket!.emit(
        'agent:send_message',
        { agentId, sessionId, message },
        (response: any) => {
          if (response.success) {
            resolve(response.message_id);
          } else {
            reject(new Error(response.error));
          }
        }
      );
    });
  }

  closeChat(agentId: string, sessionId: string, tenantId: string) {
    if (!this.socket) return;

    return new Promise((resolve, reject) => {
      this.socket!.emit(
        'agent:close_chat',
        { agentId, sessionId, tenantId },
        (response: any) => {
          if (response.success) {
            resolve(true);
          } else {
            reject(new Error(response.error));
          }
        }
      );
    });
  }

  // ===== LISTEN EVENTS =====
  onNewMessage(callback: (data: any) => void): () => void {
    const ev = 'chat:new_message';
    if (!this.socket) return () => {};
    const existing = this.listeners.get(ev) || [];
    if (existing.includes(callback)) {
      return () => this.offNewMessage(callback);
    }
    existing.push(callback);
    this.listeners.set(ev, existing);
    this.socket.on(ev, callback);
    return () => this.offNewMessage(callback);
  }

  offNewMessage(callback: (data: any) => void) {
    const ev = 'chat:new_message';
    if (!this.socket) return;
    const existing = this.listeners.get(ev) || [];
    const idx = existing.indexOf(callback);
    if (idx !== -1) {
      existing.splice(idx, 1);
      this.listeners.set(ev, existing);
      this.socket.off(ev, callback);
    }
    if (existing.length === 0) this.listeners.delete(ev);
  }

  onSessionCreated(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on('chat:session_created', callback);
  }

  onAgentAssigned(callback: (data: any) => void): (() => void) | undefined {
    if (!this.socket) return;
    this.socket.on('chat:agent_assigned', callback);
    return () => this.socket?.off('chat:agent_assigned', callback);
  }

  onSessionClosed(callback: (data: any) => void): (() => void) | undefined {
    if (!this.socket) return;
    this.socket.on('chat:session_closed', callback);
    return () => this.socket?.off('chat:session_closed', callback);
  }

  onAgentStatusChanged(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on('status:agent_count', callback);
  }

  onQueueUpdate(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on('agent:new_queue_item', callback);
  }

  // ===== QUERY STATUS =====
  getAgentStatus(tenantId: string) {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('get:agent_status', { tenantId }, (response: any) => {
        if (response.success) {
          resolve(response.online_count);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  // ===== DISCONNECT =====
  disconnect() {
    if (this.socket) {
      // remove all registered listeners
      for (const [ev, callbacks] of this.listeners.entries()) {
        callbacks.forEach((cb) => this.socket!.off(ev, cb));
      }
      this.listeners.clear();
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default new SocketService();
