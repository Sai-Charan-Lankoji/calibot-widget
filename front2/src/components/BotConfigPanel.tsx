import { useState, useEffect } from 'react'
import type { BotConfiguration } from '../../lib/types'

interface ConfigSectionProps {
  title: string
  children: React.ReactNode
}

function ConfigSection({ title, children }: ConfigSectionProps) {
  return (
    <div style={{
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '16px'
    }}>
      <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#111827' }}>
        {title}
      </h3>
      {children}
    </div>
  )
}

interface ConfigFieldProps {
  label: string
  children: React.ReactNode
}

function ConfigField({ label, children }: ConfigFieldProps) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '14px'
}

const buttonStyle: React.CSSProperties = {
  padding: '10px 20px',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: '500',
  cursor: 'pointer',
  border: 'none',
  transition: 'all 0.2s'
}

interface BotConfigPanelProps {
  botId: string
  apiBaseUrl: string
  onConfigChange?: (config: BotConfiguration) => void
}

export default function BotConfigPanel({ botId, apiBaseUrl, onConfigChange }: BotConfigPanelProps) {
  const [config, setConfig] = useState<BotConfiguration | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'general' | 'features' | 'theme'>('general')

  useEffect(() => {
    loadConfig()
  }, [])

  // Notify parent when config changes
  useEffect(() => {
    if (config && onConfigChange) {
      onConfigChange(config)
    }
  }, [config, onConfigChange])

  const loadConfig = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`${apiBaseUrl}/api/widget/init/${botId}`)
      if (!response.ok) throw new Error('Failed to load config')
      const data = await response.json()
      setConfig(data.bot)
    } catch (error) {
      console.error('Failed to load config:', error)
      alert('Failed to load configuration')
    } finally {
      setIsLoading(false)
    }
  }

  const saveConfig = async () => {
    if (!config) return
    
    try {
      setIsSaving(true)
      const response = await fetch(`${apiBaseUrl}/api/widget/config/${botId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      
      if (response.ok) {
        alert('✅ Configuration saved! The widget will reload automatically.')
        await loadConfig()
      } else {
        throw new Error('Save failed')
      }
    } catch (error) {
      console.error('Failed to save config:', error)
      alert('❌ Failed to save configuration')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading || !config) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading configuration...</div>
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>Bot Configuration</h1>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Customize your chatbot's appearance, behavior, and features</p>
        </div>
        <button
          onClick={saveConfig}
          disabled={isSaving}
          style={{
            ...buttonStyle,
            background: '#3b82f6',
            color: 'white',
            opacity: isSaving ? 0.6 : 1
          }}
        >
          {isSaving ? 'Saving...' : '💾 Save Changes'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '2px solid #e5e7eb', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {(['general', 'features', 'theme'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 24px',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid #3b82f6' : '2px solid transparent',
                color: activeTab === tab ? '#3b82f6' : '#6b7280',
                fontWeight: activeTab === tab ? '600' : '500',
                cursor: 'pointer',
                fontSize: '14px',
                marginBottom: '-2px'
              }}
            >
              {tab === 'general' && '📝 General'}
              {tab === 'features' && '⚙️ Features'}
              {tab === 'theme' && '🎨 Theme & Styling'}
            </button>
          ))}
        </div>
      </div>

      {/* General Tab */}
      {activeTab === 'general' && (
        <div>
          <ConfigSection title="📝 Basic Information">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <ConfigField label="Bot Name">
                <input
                  type="text"
                  value={config.bot_name}
                  onChange={(e) => setConfig({ ...config, bot_name: e.target.value })}
                  style={inputStyle}
                />
              </ConfigField>
              <ConfigField label="Welcome Message">
                <textarea
                  value={config.welcome_message}
                  onChange={(e) => setConfig({ ...config, welcome_message: e.target.value })}
                  style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                />
              </ConfigField>
            </div>
          </ConfigSection>

          <ConfigSection title="🖼️ Branding">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
              <ConfigField label="Avatar URL">
                <input
                  type="text"
                  value={config.theme_branding?.avatarUrl || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    theme_branding: { ...config.theme_branding!, avatarUrl: e.target.value }
                  })}
                  style={inputStyle}
                  placeholder="https://example.com/avatar.png"
                />
              </ConfigField>
              <ConfigField label="Logo URL">
                <input
                  type="text"
                  value={config.theme_branding?.logoUrl || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    theme_branding: { ...config.theme_branding!, logoUrl: e.target.value }
                  })}
                  style={inputStyle}
                  placeholder="https://example.com/logo.png"
                />
              </ConfigField>
              <ConfigField label="Company Name">
                <input
                  type="text"
                  value={config.theme_branding?.companyName || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    theme_branding: { ...config.theme_branding!, companyName: e.target.value }
                  })}
                  style={inputStyle}
                  placeholder="Your Company Name"
                />
              </ConfigField>
            </div>
          </ConfigSection>
        </div>
      )}

      {/* Features Tab */}
      {activeTab === 'features' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '16px' }}>
          {/* Chat Features */}
          <ConfigSection title="💬 Chat Features">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={config.feature_chat?.enableAI || false}
                onChange={(e) => setConfig({
                  ...config,
                  feature_chat: { ...config.feature_chat!, enableAI: e.target.checked }
                })}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ fontSize: '14px' }}>Enable AI</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={config.feature_chat?.enableLiveChat || false}
                onChange={(e) => setConfig({
                  ...config,
                  feature_chat: { ...config.feature_chat!, enableLiveChat: e.target.checked }
                })}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ fontSize: '14px' }}>Enable Live Chat</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={config.feature_chat?.agentTransferEnabled || false}
                onChange={(e) => setConfig({
                  ...config,
                  feature_chat: { ...config.feature_chat!, agentTransferEnabled: e.target.checked }
                })}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ fontSize: '14px' }}>Enable Agent Transfer</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={config.feature_chat?.showTypingIndicator || false}
                onChange={(e) => setConfig({
                  ...config,
                  feature_chat: { ...config.feature_chat!, showTypingIndicator: e.target.checked }
                })}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ fontSize: '14px' }}>Show Typing Indicator</span>
            </label>
            <ConfigField label="Message Delay (ms)">
              <input
                type="number"
                value={config.feature_chat?.messageDelay || 800}
                onChange={(e) => setConfig({
                  ...config,
                  feature_chat: { ...config.feature_chat!, messageDelay: parseInt(e.target.value) }
                })}
                style={inputStyle}
              />
            </ConfigField>
          </ConfigSection>

          {/* UI Features */}
          <ConfigSection title="🎨 UI Features">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={config.feature_ui?.darkMode || false}
                onChange={(e) => setConfig({
                  ...config,
                  feature_ui: { ...config.feature_ui!, darkMode: e.target.checked }
                })}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ fontSize: '14px' }}>🌙 Enable Dark Mode</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={config.feature_ui?.animations || false}
                onChange={(e) => setConfig({
                  ...config,
                  feature_ui: { ...config.feature_ui!, animations: e.target.checked }
                })}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ fontSize: '14px' }}>Enable Animations</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={config.feature_ui?.fileUpload || false}
                onChange={(e) => setConfig({
                  ...config,
                  feature_ui: { ...config.feature_ui!, fileUpload: e.target.checked }
                })}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ fontSize: '14px' }}>Enable File Upload</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={config.feature_ui?.soundEnabled || false}
                onChange={(e) => setConfig({
                  ...config,
                  feature_ui: { ...config.feature_ui!, soundEnabled: e.target.checked }
                })}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ fontSize: '14px' }}>Enable Sound</span>
            </label>
          </ConfigSection>

          {/* Form Features */}
          <ConfigSection title="📋 Form Settings">
            <ConfigField label="When to Collect Information">
              <select
                value={config.feature_forms?.collectInfoTiming || 'on-demand'}
                onChange={(e) => setConfig({
                  ...config,
                  feature_forms: { ...config.feature_forms!, collectInfoTiming: e.target.value as 'upfront' | 'on-demand' }
                })}
                style={inputStyle}
              >
                <option value="upfront">Upfront (Before FAQs)</option>
                <option value="on-demand">On Demand (Before Agent Transfer)</option>
              </select>
            </ConfigField>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={config.feature_forms?.gdprConsent || false}
                onChange={(e) => setConfig({
                  ...config,
                  feature_forms: { ...config.feature_forms!, gdprConsent: e.target.checked }
                })}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ fontSize: '14px' }}>Require GDPR Consent</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={config.feature_forms?.requireName || false}
                onChange={(e) => setConfig({
                  ...config,
                  feature_forms: { ...config.feature_forms!, requireName: e.target.checked }
                })}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ fontSize: '14px' }}>Require Name</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={config.feature_forms?.requireEmail || false}
                onChange={(e) => setConfig({
                  ...config,
                  feature_forms: { ...config.feature_forms!, requireEmail: e.target.checked }
                })}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ fontSize: '14px' }}>Require Email</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={config.feature_forms?.requirePhone || false}
                onChange={(e) => setConfig({
                  ...config,
                  feature_forms: { ...config.feature_forms!, requirePhone: e.target.checked }
                })}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ fontSize: '14px' }}>Require Phone</span>
            </label>
            <ConfigField label="Privacy Policy URL">
              <input
                type="text"
                value={config.feature_forms?.privacyPolicyUrl || ''}
                onChange={(e) => setConfig({
                  ...config,
                  feature_forms: { ...config.feature_forms!, privacyPolicyUrl: e.target.value }
                })}
                style={inputStyle}
                placeholder="https://example.com/privacy"
              />
            </ConfigField>
          </ConfigSection>

          {/* FAQ Features */}
          <ConfigSection title="❓ FAQ Settings">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={config.feature_faq?.showFaqList || false}
                onChange={(e) => setConfig({
                  ...config,
                  feature_faq: { ...config.feature_faq!, showFaqList: e.target.checked }
                })}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ fontSize: '14px' }}>Show FAQ List</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={config.feature_faq?.showSearch || false}
                onChange={(e) => setConfig({
                  ...config,
                  feature_faq: { ...config.feature_faq!, showSearch: e.target.checked }
                })}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ fontSize: '14px' }}>Show Search</span>
            </label>
            <ConfigField label="Max Visible FAQs">
              <input
                type="number"
                value={config.feature_faq?.maxVisible || 5}
                onChange={(e) => setConfig({
                  ...config,
                  feature_faq: { ...config.feature_faq!, maxVisible: parseInt(e.target.value) }
                })}
                style={inputStyle}
              />
            </ConfigField>
          </ConfigSection>
        </div>
      )}

      {/* Theme Tab */}
      {activeTab === 'theme' && (
        <div>
          <ConfigSection title="🎨 Theme Colors">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {Object.entries(config.theme_colors || {}).map(([key, value]) => (
                <ConfigField key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={value}
                      onChange={(e) => setConfig({
                        ...config,
                        theme_colors: { ...config.theme_colors!, [key]: e.target.value }
                      })}
                      style={{ width: '50px', height: '38px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                    />
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => setConfig({
                        ...config,
                        theme_colors: { ...config.theme_colors!, [key]: e.target.value }
                      })}
                      style={{ ...inputStyle, flex: 1 }}
                    />
                  </div>
                </ConfigField>
              ))}
            </div>
          </ConfigSection>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <ConfigSection title="📝 Typography">
              <ConfigField label="Font Family">
                <select
                  value={config.theme_typography?.fontFamily || 'Inter, sans-serif'}
                  onChange={(e) => setConfig({
                    ...config,
                    theme_typography: { ...config.theme_typography!, fontFamily: e.target.value }
                  })}
                  style={inputStyle}
                >
                  <option value="Inter, sans-serif">Inter</option>
                  <option value="Roboto, sans-serif">Roboto</option>
                  <option value="'Open Sans', sans-serif">Open Sans</option>
                  <option value="'Helvetica Neue', sans-serif">Helvetica</option>
                  <option value="Arial, sans-serif">Arial</option>
                </select>
              </ConfigField>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <ConfigField label="Font Size Base">
                  <input
                    type="text"
                    value={config.theme_typography?.fontSizeBase || '14px'}
                    onChange={(e) => setConfig({
                      ...config,
                      theme_typography: { ...config.theme_typography!, fontSizeBase: e.target.value }
                    })}
                    style={inputStyle}
                  />
                </ConfigField>
                <ConfigField label="Line Height">
                  <input
                    type="number"
                    step="0.1"
                    value={config.theme_typography?.lineHeight || 1.5}
                    onChange={(e) => setConfig({
                      ...config,
                      theme_typography: { ...config.theme_typography!, lineHeight: parseFloat(e.target.value) }
                    })}
                    style={inputStyle}
                  />
                </ConfigField>
              </div>
            </ConfigSection>

            <ConfigSection title="📐 Layout & Spacing">
              <ConfigField label="Border Radius (Widget Container)">
                <select
                  value={config.theme_layout?.borderRadius || '1rem'}
                  onChange={(e) => setConfig({
                    ...config,
                    theme_layout: { ...config.theme_layout!, borderRadius: e.target.value }
                  })}
                  style={inputStyle}
                >
                  <option value="0rem">Square (0px)</option>
                  <option value="0.5rem">Small (8px)</option>
                  <option value="1rem">Medium (16px)</option>
                  <option value="1.5rem">Large (24px)</option>
                  <option value="2rem">Extra Large (32px)</option>
                </select>
              </ConfigField>
              <ConfigField label="Button Radius">
                <select
                  value={config.theme_layout?.buttonRadius || '0.75rem'}
                  onChange={(e) => setConfig({
                    ...config,
                    theme_layout: { ...config.theme_layout!, buttonRadius: e.target.value }
                  })}
                  style={inputStyle}
                >
                  <option value="0rem">Square (0px)</option>
                  <option value="0.25rem">Tiny (4px)</option>
                  <option value="0.5rem">Small (8px)</option>
                  <option value="0.75rem">Medium (12px)</option>
                  <option value="1rem">Large (16px)</option>
                  <option value="9999px">Pill/Full Round</option>
                </select>
              </ConfigField>
              <ConfigField label="Input Radius">
                <select
                  value={config.theme_layout?.inputRadius || '0.75rem'}
                  onChange={(e) => setConfig({
                    ...config,
                    theme_layout: { ...config.theme_layout!, inputRadius: e.target.value }
                  })}
                  style={inputStyle}
                >
                  <option value="0rem">Square (0px)</option>
                  <option value="0.25rem">Tiny (4px)</option>
                  <option value="0.5rem">Small (8px)</option>
                  <option value="0.75rem">Medium (12px)</option>
                  <option value="1rem">Large (16px)</option>
                  <option value="9999px">Pill/Full Round</option>
                </select>
              </ConfigField>
              <ConfigField label="Avatar Radius">
                <select
                  value={config.theme_layout?.avatarRadius || '9999px'}
                  onChange={(e) => setConfig({
                    ...config,
                    theme_layout: { ...config.theme_layout!, avatarRadius: e.target.value }
                  })}
                  style={inputStyle}
                >
                  <option value="0rem">Square (0px)</option>
                  <option value="0.5rem">Rounded Square (8px)</option>
                  <option value="1rem">Rounded (16px)</option>
                  <option value="9999px">Circle (Full Round)</option>
                </select>
              </ConfigField>
            </ConfigSection>
          </div>
        </div>
      )}
    </div>
  )
}
