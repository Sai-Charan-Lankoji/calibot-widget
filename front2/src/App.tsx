import { CaliChatWidget } from "../lib/Widget/CaliChatWidget"
import BotConfigPanel from "./components/BotConfigPanel"
import "../lib/Widget/globals.css"
import { useState } from "react"
import type { BotConfiguration } from "../lib/types"

function App() {
  const [botId] = useState("bbf342b4-832f-4793-93c3-23d1c91adf95")
  const [apiBaseUrl] = useState("https://yanira-diacidic-tommie.ngrok-free.app")
  const [showWidget, setShowWidget] = useState(true)
  const [currentConfig, setCurrentConfig] = useState<BotConfiguration | null>(null)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      {/* Config Panel - Left Side */}
      <div style={{ flex: '1', overflowY: 'auto' }}>
        <BotConfigPanel 
          botId={botId} 
          apiBaseUrl={apiBaseUrl}
          onConfigChange={setCurrentConfig}
        />
      </div>

      {/* Widget Toggle Button */}
      <button
        onClick={() => setShowWidget(!showWidget)}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '10px 20px',
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600',
          zIndex: 9999,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}
      >
        {showWidget ? '👁️ Hide Widget' : '👁️ Show Widget'}
      </button>

      {/* Widget - Re-renders when config changes */}
      {showWidget && currentConfig && (
        <CaliChatWidget 
          key={JSON.stringify({
            colors: currentConfig.theme_colors,
            layout: currentConfig.theme_layout,
            typography: currentConfig.theme_typography,
            name: currentConfig.bot_name,
            darkMode: currentConfig.feature_ui?.darkMode
          })}
          botId={botId}
          apiBaseUrl={apiBaseUrl}
          primaryColor={currentConfig.theme_colors?.primary}
          botName={currentConfig.bot_name}
          welcomeMessage={currentConfig.welcome_message}
          position={currentConfig.theme_layout?.position}
          avatarSrc={currentConfig.theme_branding?.avatarUrl || undefined}
          initialConfig={currentConfig}
        />
      )}
    </div>
  )
}

export default App
