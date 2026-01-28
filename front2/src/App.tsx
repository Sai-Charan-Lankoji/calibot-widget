
import { CaliChatWidget } from "../lib/Widget/CaliChatWidget"
import BotConfigPanel from "./components/BotConfigPanel"
import "../lib/Widget/globals.css"
import { useState, useCallback } from "react"
import type { BotConfiguration } from "../lib/types"
import type { WidgetPosition } from "../lib/Widget/constants"

// ============================================================================
// TYPES
// ============================================================================

type PreviewMode = 'development' | 'cdn-simulation';

interface DevToolbarProps {
  showWidget: boolean;
  onToggleWidget: () => void;
  previewMode: PreviewMode;
  onPreviewModeChange: (mode: PreviewMode) => void;
  position: WidgetPosition;
  onPositionChange: (pos: WidgetPosition) => void;
}

// ============================================================================
// DEV TOOLBAR COMPONENT
// ============================================================================

function DevToolbar({ 
  showWidget, 
  onToggleWidget, 
  previewMode, 
  onPreviewModeChange,
  position,
  onPositionChange 
}: DevToolbarProps) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      background: '#1e293b',
      color: 'white',
      padding: '8px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      zIndex: 10000,
      fontSize: '13px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
    }}>
      {/* Logo/Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '16px' }}>🤖</span>
        <span style={{ fontWeight: 600 }}>Widget Dev Tools</span>
      </div>
      
      <div style={{ width: '1px', height: '20px', background: '#475569' }} />
      
      {/* Widget Toggle */}
      <button
        onClick={onToggleWidget}
        style={{
          padding: '6px 12px',
          background: showWidget ? '#22c55e' : '#64748b',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        {showWidget ? '👁️ Widget ON' : '👁️‍🗨️ Widget OFF'}
      </button>
      
      {/* Position Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: '#94a3b8' }}>Position:</span>
        <select
          value={position}
          onChange={(e) => onPositionChange(e.target.value as WidgetPosition)}
          style={{
            padding: '6px 10px',
            background: '#334155',
            color: 'white',
            border: '1px solid #475569',
            borderRadius: '6px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          <option value="bottom-right">↘ Bottom Right</option>
          <option value="bottom-left">↙ Bottom Left</option>
        </select>
      </div>
      
      {/* Preview Mode Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: '#94a3b8' }}>Mode:</span>
        <div style={{ 
          display: 'flex', 
          background: '#334155', 
          borderRadius: '6px',
          overflow: 'hidden'
        }}>
          <button
            onClick={() => onPreviewModeChange('development')}
            style={{
              padding: '6px 12px',
              background: previewMode === 'development' ? '#3b82f6' : 'transparent',
              color: 'white',
              border: 'none',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            🛠️ Dev
          </button>
          <button
            onClick={() => onPreviewModeChange('cdn-simulation')}
            style={{
              padding: '6px 12px',
              background: previewMode === 'cdn-simulation' ? '#8b5cf6' : 'transparent',
              color: 'white',
              border: 'none',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            📦 CDN Sim
          </button>
        </div>
      </div>
      
      {/* Status indicator */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{ 
          width: '8px', 
          height: '8px', 
          borderRadius: '50%', 
          background: '#22c55e',
          animation: 'pulse 2s infinite'
        }} />
        <span style={{ color: '#94a3b8', fontSize: '12px' }}>
          {previewMode === 'cdn-simulation' ? 'Simulating CDN build' : 'Development mode'}
        </span>
      </div>
    </div>
  )
}

// ============================================================================
// CDN CODE PREVIEW COMPONENT
// ============================================================================

interface CDNCodePreviewProps {
  botId: string;
  apiBaseUrl: string;
  position: WidgetPosition;
}

function CDNCodePreview({ botId, apiBaseUrl, position }: CDNCodePreviewProps) {
  const [copied, setCopied] = useState(false);
  
  const cdnCode = `<!-- Cali Chat Widget -->
<script src="${apiBaseUrl}/widget/cali-chat-widget.umd.js"><\/script>
<script>
  window.addEventListener('load', function() {
    CaliChatWidget.init({
      botId: '${botId}',
      apiBaseUrl: '${apiBaseUrl}',
      position: '${position}'
    });
  });
<\/script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(cdnCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      background: '#0f172a',
      border: '1px solid #334155',
      borderRadius: '8px',
      overflow: 'hidden',
      marginBottom: '16px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 12px',
        background: '#1e293b',
        borderBottom: '1px solid #334155'
      }}>
        <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 500 }}>
          📋 CDN Embed Code
        </span>
        <button
          onClick={handleCopy}
          style={{
            padding: '4px 10px',
            background: copied ? '#22c55e' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          {copied ? '✓ Copied!' : 'Copy'}
        </button>
      </div>
      <pre style={{
        margin: 0,
        padding: '12px',
        color: '#e2e8f0',
        fontSize: '11px',
        lineHeight: 1.6,
        overflow: 'auto',
        maxHeight: '150px'
      }}>
        <code>{cdnCode}</code>
      </pre>
    </div>
  )
}

// ============================================================================
// SIMULATED HOST PAGE COMPONENT
// ============================================================================

interface SimulatedHostPageProps {
  children: React.ReactNode;
}

function SimulatedHostPage({ children }: SimulatedHostPageProps) {
  return (
    <div style={{
      flex: 1,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      minHeight: '100%'
    }}>
      {/* Fake website content */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '40px',
        maxWidth: '600px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
      }}>
        <h1 style={{ fontSize: '32px', marginBottom: '16px', color: '#1f2937' }}>
          🌐 Sample Website
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '24px', lineHeight: 1.6 }}>
          This simulates how your widget will appear on a customer's website. 
          The widget is completely isolated from the host page's styles using Shadow DOM.
        </p>
        <div style={{
          background: '#f3f4f6',
          padding: '20px',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#374151'
        }}>
          <strong>CDN Simulation Mode</strong><br/>
          The widget behaves exactly as it would when loaded via CDN script on any website.
        </div>
      </div>
      
      {/* Widget rendered on top */}
      {children}
    </div>
  )
}

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

function App() {
  const [botId] = useState("bbf342b4-832f-4793-93c3-23d1c91adf95")
  const [apiBaseUrl] = useState("http://localhost:3001")
  const [showWidget, setShowWidget] = useState(true)
  const [currentConfig, setCurrentConfig] = useState<BotConfiguration | null>(null)
  const [previewMode, setPreviewMode] = useState<PreviewMode>('development')
  const [position, setPosition] = useState<WidgetPosition>('bottom-right')

  // Merge position into config when it changes
  const handlePositionChange = useCallback((newPosition: WidgetPosition) => {
    setPosition(newPosition);
    if (currentConfig) {
      setCurrentConfig({
        ...currentConfig,
        theme_layout: {
          ...currentConfig.theme_layout!,
          position: newPosition
        }
      });
    }
  }, [currentConfig]);

  const widgetElement = showWidget && currentConfig && (
    <CaliChatWidget 
      botId={botId}
      apiBaseUrl={apiBaseUrl}
      primaryColor={currentConfig.theme_colors?.primary}
      botName={currentConfig.bot_name}
      welcomeMessage={currentConfig.welcome_message}
      position={position}
      avatarSrc={currentConfig.theme_branding?.avatarUrl || undefined}
      initialConfig={{
        ...currentConfig,
        theme_layout: {
          ...currentConfig.theme_layout!,
          position
        }
      }}
    />
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Dev Toolbar */}
      <DevToolbar
        showWidget={showWidget}
        onToggleWidget={() => setShowWidget(!showWidget)}
        previewMode={previewMode}
        onPreviewModeChange={setPreviewMode}
        position={position}
        onPositionChange={handlePositionChange}
      />

      {/* Main Content Area */}
      <div style={{ 
        display: 'flex', 
        flex: 1, 
        marginTop: '48px', // Space for toolbar
        background: '#f8fafc' 
      }}>
        {previewMode === 'development' ? (
          <>
            {/* Config Panel - Left Side */}
            <div style={{ 
              width: '60%', 
              overflowY: 'auto', 
              borderRight: '1px solid #e5e7eb',
              maxHeight: 'calc(100vh - 48px)'
            }}>
              <BotConfigPanel 
                botId={botId} 
                apiBaseUrl={apiBaseUrl}
                onConfigChange={setCurrentConfig}
              />
            </div>

            {/* Preview Area - Right Side */}
            <div style={{ 
              width: '40%', 
              display: 'flex', 
              flexDirection: 'column',
              padding: '20px',
              overflowY: 'auto',
              maxHeight: 'calc(100vh - 48px)'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: '#374151' }}>
                📦 Embed Code Preview
              </h3>
              <CDNCodePreview botId={botId} apiBaseUrl={apiBaseUrl} position={position} />
              
              <div style={{
                flex: 1,
                background: '#e5e7eb',
                borderRadius: '12px',
                position: 'relative',
                minHeight: '400px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ color: '#9ca3af', fontSize: '14px' }}>
                  Widget preview area →
                </span>
              </div>
            </div>

            {/* Widget overlay in dev mode */}
            {widgetElement}
          </>
        ) : (
          /* CDN Simulation Mode - Full screen simulated host page */
          <SimulatedHostPage>
            {widgetElement}
          </SimulatedHostPage>
        )}
      </div>
    </div>
  )
}

export default App
