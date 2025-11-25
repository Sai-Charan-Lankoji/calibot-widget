import { CaliChatWidget } from "../lib/Widget/CaliChatWidget";
import "../lib/Widget/globals.css";
import { useState, useEffect } from "react";

interface BotConfig {
  id: string;
  bot_name: string;
  welcome_message: string;
  has_live_chat_agents? : boolean;
  auto_assign_to_agent?: boolean;
  agent_transfer_enabled?: boolean;
  has_ai_assistance?: boolean;
  fallback_to_agent?: boolean;
  file_upload_enabled?: boolean;
  theme_config: {
    primaryColor?: string;
    position: 'bottom-right' | 'bottom-left';
    avatarSrc: string | null;
    borderRadius?: string | null;
    fontFamily?: string | null;
  };
  feature_config: {
    has_live_chat_agents?: boolean | null;
    agent_transfer_enabled?: boolean | null;
    file_upload_enabled?: boolean | null;
  };
}

interface Conversation {
  id: string;
  visitor_info: {
    name: string;
    email: string;
  };
  status: string;
  started_at: string;
  message_count: number;
  last_message?: {
    content: { text: string };
    timestamp: string;
  };
}

// Default theme configuration for fallback
const DEFAULT_THEME_CONFIG = {
  primaryColor: '#3B82F6',
  fontFamily: 'Inter, system-ui, sans-serif',
  borderRadius: '1rem',
  position: 'bottom-right' as const
};

function App() {
  const [botId] = useState("bbf342b4-832f-4793-93c3-23d1c91adf95");
  const [apiBaseUrl] = useState("http://localhost:3002");
  
  const [config, setConfig] = useState<BotConfig | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'conversations'>('config');

  // Load config from backend
  useEffect(() => {
    loadConfig();
  }, []);

  // Poll conversations only when on conversations tab
  useEffect(() => {
    if (activeTab === 'conversations') {
      loadConversations();
      const interval = setInterval(loadConversations, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${apiBaseUrl}/api/widget/init/${botId}`);
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      
      const data = await response.json();
      
      // Merge backend theme config with defaults
      const mergedThemeConfig = {
        ...DEFAULT_THEME_CONFIG,
        ...(data.bot.theme_config || {})
      };
      
      const botWithDefaults = {
        ...data.bot,
        theme_config: mergedThemeConfig
      };
      
      setConfig(botWithDefaults);
    } catch (error) {
      console.error('Failed to load config:', error);
      alert(`Failed to load config: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversations = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/conversations`);
      const data = await response.json();
      setConversations(data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const saveConfig = async () => {
    if (!config) return;
    
    try {
      setIsSaving(true);
      const response = await fetch(`${apiBaseUrl}/api/widget/config/${botId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        alert('✅ Configuration saved! The widget will reload automatically.');
        await loadConfig(); // Reload to get updated timestamp
      }
    } catch (error) {
      console.error('Failed to save config:', error);
      alert('❌ Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const updateConfig = (updates: Partial<BotConfig>) => {
    setConfig(prev => prev ? { ...prev, ...updates } : null);
  };

  const updateThemeConfig = (updates: Partial<BotConfig['theme_config']>) => {
    setConfig(prev => prev ? {
      ...prev,
      theme_config: { ...prev.theme_config, ...updates }
    } : null);
  };

  if (isLoading || !config) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: "40px", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ marginBottom: "30px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "10px" }}>
          Cali Chat Widget - Development Panel
        </h1>
        <p style={{ color: "#64748b" }}>
          Configure your widget in real-time and monitor conversations
        </p>
      </div>

      {/* Status Bar */}
      <div style={{ 
        background: "#f0f9ff", 
        border: "1px solid #3b82f6", 
        borderRadius: "8px", 
        padding: "15px 20px",
        marginBottom: "30px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div>
          <span style={{ fontSize: "14px", color: "#475569" }}>
            🟢 Mock API: <code>http://localhost:3001</code>
          </span>
          <span style={{ marginLeft: "20px", fontSize: "14px", color: "#475569" }}>
            💬 Active Conversations: <strong>{conversations.length}</strong>
          </span>
        </div>
        <button
          onClick={saveConfig}
          disabled={isSaving}
          style={{
            padding: "8px 16px",
            background: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: isSaving ? "not-allowed" : "pointer",
            fontWeight: "600",
            opacity: isSaving ? 0.6 : 1
          }}
        >
          {isSaving ? '💾 Saving...' : '💾 Save Config'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: "20px", borderBottom: "2px solid #e2e8f0" }}>
        <button
          onClick={() => setActiveTab('config')}
          style={{
            padding: "10px 20px",
            background: "none",
            border: "none",
            borderBottom: activeTab === 'config' ? '3px solid #3b82f6' : 'none',
            cursor: "pointer",
            fontWeight: "600",
            color: activeTab === 'config' ? '#3b82f6' : '#64748b',
            marginRight: "10px"
          }}
        >
          ⚙️ Configuration
        </button>
        <button
          onClick={() => setActiveTab('conversations')}
          style={{
            padding: "10px 20px",
            background: "none",
            border: "none",
            borderBottom: activeTab === 'conversations' ? '3px solid #3b82f6' : 'none',
            cursor: "pointer",
            fontWeight: "600",
            color: activeTab === 'conversations' ? '#3b82f6' : '#64748b'
          }}
        >
          💬 Conversations ({conversations.length})
        </button>
      </div>

      {/* Config Tab */}
      {activeTab === 'config' && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div>
            <ConfigSection title="🎨 Theme">
              <ConfigField label="Primary Color">
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <input 
                    type="color" 
                    value={config.theme_config.primaryColor}
                    onChange={(e) => updateThemeConfig({ primaryColor: e.target.value })}
                    style={{ width: "60px", height: "40px", cursor: "pointer", border: "1px solid #e2e8f0", borderRadius: "6px" }}
                  />
                  <code style={{ fontSize: "13px", color: "#64748b" }}>
                    {config.theme_config.primaryColor}
                  </code>
                </div>
              </ConfigField>

              <ConfigField label="Position">
                <select 
                  value={config.theme_config.position}
                  onChange={(e) => updateThemeConfig({ position: e.target.value as any })}
                  style={inputStyle}
                >
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                </select>
              </ConfigField>

              <ConfigField label="Avatar URL (optional)">
                <input 
                  type="text" 
                  value={config.theme_config.avatarSrc || ''}
                  onChange={(e) => updateThemeConfig({ avatarSrc: e.target.value || null })}
                  style={inputStyle}
                  placeholder="https://example.com/avatar.png"
                />
              </ConfigField>

              <ConfigField label="Font Family">
                <select 
                  value={config.theme_config.fontFamily || 'Inter, sans-serif'}
                  onChange={(e) => updateThemeConfig({ fontFamily: e.target.value })}
                  style={inputStyle}
                >
                  <option value="Inter, sans-serif">Inter (Default)</option>
                  <option value="'Helvetica Neue', sans-serif">Helvetica Neue</option>
                  <option value="'Georgia', serif">Georgia</option>
                  <option value="'Courier New', monospace">Courier New</option>
                </select>
              </ConfigField>

              <ConfigField label="Border Radius">
                <select 
                  value={config.theme_config.borderRadius || '1rem'}
                  onChange={(e) => updateThemeConfig({ borderRadius: e.target.value })}
                  style={inputStyle}
                >
                  <option value="0rem">Square (0px)</option>
                  <option value="0.5rem">Small (8px)</option>
                  <option value="1rem">Medium (16px)</option>
                  <option value="1.5rem">Large (24px)</option>
                </select>
              </ConfigField>
            </ConfigSection>

            <ConfigSection title="📝 Bot Settings">
              <ConfigField label="Bot Name">
                <input 
                  type="text" 
                  value={config.bot_name}
                  onChange={(e) => updateConfig({ bot_name: e.target.value })}
                  style={inputStyle}
                />
              </ConfigField>

              <ConfigField label="Welcome Message">
                <textarea 
                  value={config.welcome_message}
                  onChange={(e) => updateConfig({ welcome_message: e.target.value })}
                  style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
                />
              </ConfigField>
            </ConfigSection>
          </div>

          <div>
            <ConfigSection title="🎯 Features">
              <ConfigField label="">
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input 
                    type="checkbox" 
                    checked={config.has_live_chat_agents || false}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      feature_config: { ...prev.feature_config, has_live_chat_agents: e.target.checked }
                    } : null)}
                    style={{ width: "18px", height: "18px" }}
                  />
                  <span>Enable Live Chat Agents</span>
                </label>
              </ConfigField>

              <ConfigField label="">
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input 
                    type="checkbox" 
                    checked={config.agent_transfer_enabled || false}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      feature_config: { ...prev.feature_config, agent_transfer_enabled: e.target.checked }
                    } : null)}
                    style={{ width: "18px", height: "18px" }}
                  />
                  <span>Enable Agent Transfer</span>
                </label>
              </ConfigField>

              <ConfigField label="">
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input 
                    type="checkbox" 
                    checked={config.file_upload_enabled || false}
                    onChange={(e) => setConfig(prev => prev ? {
                      ...prev,
                      feature_config: { ...prev.feature_config, file_upload_enabled: e.target.checked }
                    } : null)}
                    style={{ width: "18px", height: "18px" }}
                  />
                  <span>Enable File Upload</span>
                </label>
              </ConfigField>
            </ConfigSection>

            <div style={{
              background: "#fef3c7",
              border: "1px solid #f59e0b",
              borderRadius: "8px",
              padding: "20px"
            }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "10px" }}>
                💡 Testing Tips
              </h3>
              <ul style={{ fontSize: "14px", lineHeight: "1.8", paddingLeft: "20px" }}>
                <li>Changes are applied immediately to the widget</li>
                <li>Click "Save Config" to persist changes to JSON</li>
                <li>Conversations are stored in <code>backend_test/data/</code></li>
                <li>Try different colors and positions live!</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Conversations Tab */}
      {activeTab === 'conversations' && (
        <div>
          {conversations.length === 0 ? (
            <div style={{
              background: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "40px",
              textAlign: "center"
            }}>
              <p style={{ fontSize: "18px", color: "#64748b" }}>
                No conversations yet. Open the widget to start chatting!
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "15px" }}>
              {conversations.map(conv => (
                <div key={conv.id} style={{
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "20px"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                    <div>
                      <strong style={{ fontSize: "16px" }}>{conv.visitor_info.name}</strong>
                      <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0" }}>
                        {conv.visitor_info.email}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{
                        background: conv.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2',
                        color: conv.status === 'ACTIVE' ? '#166534' : '#991b1b',
                        padding: "4px 12px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "600"
                      }}>
                        {conv.status}
                      </span>
                      <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
                        {new Date(conv.started_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  {conv.last_message && (
                    <div style={{
                      background: "#f8fafc",
                      padding: "12px",
                      borderRadius: "6px",
                      marginTop: "10px"
                    }}>
                      <p style={{ fontSize: "13px", color: "#475569" }}>
                        Last message: "{conv.last_message.content.text}"
                      </p>
                    </div>
                  )}
                  
                  <div style={{ marginTop: "10px", fontSize: "13px", color: "#64748b" }}>
                    💬 {conv.message_count} messages
                  </div>

                  {/* Agent Simulation Tool */}
                  <div style={{ marginTop: "15px", borderTop: "1px solid #f1f5f9", paddingTop: "15px" }}>
                    <p style={{ fontSize: "12px", fontWeight: "600", marginBottom: "8px", color: "#475569" }}>
                      👨‍💼 Simulate Agent Reply
                    </p>
                    <form 
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const form = e.target as HTMLFormElement;
                        const input = form.elements.namedItem('agentMsg') as HTMLInputElement;
                        const text = input.value;
                        if (!text) return;

                        try {
                          await fetch(`${apiBaseUrl}/api/admin/conversations/${conv.id}/agent-message`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ text, agentName: 'Sarah (Agent)' })
                          });
                          input.value = '';
                          loadConversations(); // Refresh list
                        } catch {
                          alert('Failed to send agent message');
                        }
                      }}
                      style={{ display: "flex", gap: "8px" }}
                    >
                      <input 
                        name="agentMsg"
                        type="text" 
                        placeholder="Type as agent..."
                        style={{ ...inputStyle, fontSize: "13px", padding: "6px 10px" }}
                      />
                      <button 
                        type="submit"
                        style={{
                          background: "#0f172a",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          padding: "0 12px",
                          fontSize: "12px",
                          cursor: "pointer"
                        }}
                      >
                        Send
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Widget (always rendered with live config) */}
      <CaliChatWidget 
        key={JSON.stringify(config)} // Force re-render on config change
        botId={botId}
        apiBaseUrl={apiBaseUrl}
        primaryColor={config.theme_config.primaryColor}
        botName={config.bot_name}
        welcomeMessage={config.welcome_message}
        position={config.theme_config.position}
        avatarSrc={config.theme_config.avatarSrc || undefined}
      />
    </div>
  );
}

// Helper components
function ConfigSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "white",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      padding: "20px",
      marginBottom: "20px"
    }}>
      <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "15px" }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function ConfigField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "15px" }}>
      {label && (
        <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "5px" }}>
          {label}
        </label>
      )}
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  border: "1px solid #e2e8f0",
  borderRadius: "6px",
  fontSize: "14px"
};

export default App;
