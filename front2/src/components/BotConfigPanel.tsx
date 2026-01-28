import { useState, useEffect, useCallback, memo } from 'react'
import type { BotConfiguration } from '../../lib/types'

// ============================================================================
// TYPES
// ============================================================================

interface ConfigSectionProps {
  title: string
  children: React.ReactNode
  collapsible?: boolean
  defaultOpen?: boolean
}

interface ConfigFieldProps {
  label: string
  children: React.ReactNode
  hint?: string
}

interface BotConfigPanelProps {
  botId: string
  apiBaseUrl: string
  onConfigChange?: (config: BotConfiguration) => void
}

type TabType = 'general' | 'features' | 'theme';

// ============================================================================
// STYLES
// ============================================================================

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '14px',
  transition: 'border-color 0.2s, box-shadow 0.2s'
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

const checkboxLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '12px',
  cursor: 'pointer'
}

// ============================================================================
// REUSABLE COMPONENTS
// ============================================================================

const ConfigSection = memo(function ConfigSection({ 
  title, 
  children, 
  collapsible = false, 
  defaultOpen = true 
}: ConfigSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div style={{
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      marginBottom: '16px',
      overflow: 'hidden'
    }}>
      <div 
        onClick={() => collapsible && setIsOpen(!isOpen)}
        style={{
          padding: '16px 20px',
          borderBottom: isOpen ? '1px solid #e5e7eb' : 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: collapsible ? 'pointer' : 'default',
          background: '#f9fafb'
        }}
      >
        <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', margin: 0 }}>
          {title}
        </h3>
        {collapsible && (
          <span style={{ color: '#6b7280', fontSize: '12px' }}>
            {isOpen ? '▼' : '▶'}
          </span>
        )}
      </div>
      {isOpen && (
        <div style={{ padding: '20px' }}>
          {children}
        </div>
      )}
    </div>
  );
});

const ConfigField = memo(function ConfigField({ label, children, hint }: ConfigFieldProps) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ 
        display: 'block', 
        fontSize: '13px', 
        fontWeight: '500', 
        marginBottom: '6px', 
        color: '#374151' 
      }}>
        {label}
      </label>
      {children}
      {hint && (
        <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
          {hint}
        </p>
      )}
    </div>
  );
});

interface CheckboxFieldProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon?: string;
}

const CheckboxField = memo(function CheckboxField({ label, checked, onChange, icon }: CheckboxFieldProps) {
  return (
    <label style={checkboxLabelStyle}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
      />
      <span style={{ fontSize: '14px' }}>
        {icon && `${icon} `}{label}
      </span>
    </label>
  );
});

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const ColorField = memo(function ColorField({ label, value, onChange }: ColorFieldProps) {
  return (
    <ConfigField label={label}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ 
            width: '50px', 
            height: '38px', 
            border: '1px solid #d1d5db', 
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...inputStyle, flex: 1 }}
        />
      </div>
    </ConfigField>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function BotConfigPanel({ botId, apiBaseUrl, onConfigChange }: BotConfigPanelProps) {
  const [config, setConfig] = useState<BotConfiguration | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('general')

  const loadConfig = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`${apiBaseUrl}/api/widget/init/${botId}`, { 
        headers: { "ngrok-skip-browser-warning": "true" } 
      })
      if (!response.ok) throw new Error('Failed to load config')
      const data = await response.json()
      setConfig(data.bot)
    } catch (error) {
      console.error('Failed to load config:', error)
      alert('Failed to load configuration')
    } finally {
      setIsLoading(false)
    }
  }, [apiBaseUrl, botId]);

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  // Notify parent when config changes
  useEffect(() => {
    if (config && onConfigChange) {
      onConfigChange(config)
    }
  }, [config, onConfigChange])

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
          {/* Primary Brand Colors */}
          <ConfigSection title="🎨 Brand Colors" collapsible defaultOpen>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              <ColorField 
                label="Primary Color" 
                value={config.theme_colors?.primary || '#3b82f6'}
                onChange={(v) => setConfig({ ...config, theme_colors: { ...config.theme_colors!, primary: v } })}
              />
              <ColorField 
                label="Primary Content" 
                value={config.theme_colors?.primaryContent || '#ffffff'}
                onChange={(v) => setConfig({ ...config, theme_colors: { ...config.theme_colors!, primaryContent: v } })}
              />
              <ColorField 
                label="Secondary Color" 
                value={config.theme_colors?.secondary || '#6366f1'}
                onChange={(v) => setConfig({ ...config, theme_colors: { ...config.theme_colors!, secondary: v } })}
              />
              <ColorField 
                label="Secondary Content" 
                value={config.theme_colors?.secondaryContent || '#ffffff'}
                onChange={(v) => setConfig({ ...config, theme_colors: { ...config.theme_colors!, secondaryContent: v } })}
              />
              <ColorField 
                label="Accent Color" 
                value={config.theme_colors?.accent || '#37cdbe'}
                onChange={(v) => setConfig({ ...config, theme_colors: { ...config.theme_colors!, accent: v } })}
              />
              <ColorField 
                label="Accent Content" 
                value={config.theme_colors?.accentContent || '#163835'}
                onChange={(v) => setConfig({ ...config, theme_colors: { ...config.theme_colors!, accentContent: v } })}
              />
            </div>
          </ConfigSection>

          {/* Base/Background Colors */}
          <ConfigSection title="🏠 Base Colors" collapsible defaultOpen>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              <ColorField 
                label="Base 100 (Background)" 
                value={config.theme_colors?.base100 || '#ffffff'}
                onChange={(v) => setConfig({ ...config, theme_colors: { ...config.theme_colors!, base100: v } })}
              />
              <ColorField 
                label="Base 200 (Cards)" 
                value={config.theme_colors?.base200 || '#f9fafb'}
                onChange={(v) => setConfig({ ...config, theme_colors: { ...config.theme_colors!, base200: v } })}
              />
              <ColorField 
                label="Base 300 (Borders)" 
                value={config.theme_colors?.base300 || '#d1d5db'}
                onChange={(v) => setConfig({ ...config, theme_colors: { ...config.theme_colors!, base300: v } })}
              />
              <ColorField 
                label="Base Content (Text)" 
                value={config.theme_colors?.baseContent || '#1f2937'}
                onChange={(v) => setConfig({ ...config, theme_colors: { ...config.theme_colors!, baseContent: v } })}
              />
              <ColorField 
                label="Neutral" 
                value={config.theme_colors?.neutral || '#3d4451'}
                onChange={(v) => setConfig({ ...config, theme_colors: { ...config.theme_colors!, neutral: v } })}
              />
              <ColorField 
                label="Neutral Content" 
                value={config.theme_colors?.neutralContent || '#ffffff'}
                onChange={(v) => setConfig({ ...config, theme_colors: { ...config.theme_colors!, neutralContent: v } })}
              />
            </div>
          </ConfigSection>

          {/* Chat Bubble Colors */}
          <ConfigSection title="💬 Chat Bubble Colors" collapsible defaultOpen>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              <ColorField 
                label="User Bubble Background" 
                value={config.theme_colors?.user_bubble_bg || '#3b82f6'}
                onChange={(v) => setConfig({ ...config, theme_colors: { ...config.theme_colors!, user_bubble_bg: v } })}
              />
              <ColorField 
                label="User Bubble Text" 
                value={config.theme_colors?.user_bubble_text || '#ffffff'}
                onChange={(v) => setConfig({ ...config, theme_colors: { ...config.theme_colors!, user_bubble_text: v } })}
              />
              <ColorField 
                label="Bot Bubble Background" 
                value={config.theme_colors?.bot_bubble_bg || '#f1f5f9'}
                onChange={(v) => setConfig({ ...config, theme_colors: { ...config.theme_colors!, bot_bubble_bg: v } })}
              />
              <ColorField 
                label="Bot Bubble Text" 
                value={config.theme_colors?.bot_bubble_text || '#0f172a'}
                onChange={(v) => setConfig({ ...config, theme_colors: { ...config.theme_colors!, bot_bubble_text: v } })}
              />
            </div>
          </ConfigSection>

          {/* Status Colors */}
          <ConfigSection title="🚦 Status Colors" collapsible defaultOpen={false}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              <ColorField 
                label="Success" 
                value={config.theme_colors?.success || '#36d399'}
                onChange={(v) => setConfig({ ...config, theme_colors: { ...config.theme_colors!, success: v } })}
              />
              <ColorField 
                label="Warning" 
                value={config.theme_colors?.warning || '#fbbd23'}
                onChange={(v) => setConfig({ ...config, theme_colors: { ...config.theme_colors!, warning: v } })}
              />
              <ColorField 
                label="Error" 
                value={config.theme_colors?.error || '#f87272'}
                onChange={(v) => setConfig({ ...config, theme_colors: { ...config.theme_colors!, error: v } })}
              />
              <ColorField 
                label="Info" 
                value={config.theme_colors?.info || '#3abff8'}
                onChange={(v) => setConfig({ ...config, theme_colors: { ...config.theme_colors!, info: v } })}
              />
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
                  <option value="Inter, system-ui, sans-serif">Inter</option>
                  <option value="Roboto, sans-serif">Roboto</option>
                  <option value="'Open Sans', sans-serif">Open Sans</option>
                  <option value="'Helvetica Neue', sans-serif">Helvetica</option>
                  <option value="Arial, sans-serif">Arial</option>
                  <option value="system-ui, sans-serif">System UI</option>
                </select>
              </ConfigField>
              <ConfigField label="Font Size">
                <select
                  value={config.theme_typography?.fontSize || '14px'}
                  onChange={(e) => setConfig({
                    ...config,
                    theme_typography: { ...config.theme_typography!, fontSize: e.target.value }
                  })}
                  style={inputStyle}
                >
                  <option value="12px">Small (12px)</option>
                  <option value="14px">Medium (14px)</option>
                  <option value="16px">Large (16px)</option>
                </select>
              </ConfigField>
            </ConfigSection>

            <ConfigSection title="📐 Layout & Dimensions">
              <ConfigField label="Widget Position" hint="Where the widget appears on the screen">
                <select
                  value={config.theme_layout?.position || 'bottom-right'}
                  onChange={(e) => setConfig({
                    ...config,
                    theme_layout: { ...config.theme_layout!, position: e.target.value }
                  })}
                  style={inputStyle}
                >
                  <option value="bottom-right">↘ Bottom Right</option>
                  <option value="bottom-left">↙ Bottom Left</option>
                </select>
              </ConfigField>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <ConfigField label="Width">
                  <select
                    value={config.theme_layout?.width || '380px'}
                    onChange={(e) => setConfig({
                      ...config,
                      theme_layout: { ...config.theme_layout!, width: e.target.value }
                    })}
                    style={inputStyle}
                  >
                    <option value="320px">Narrow (320px)</option>
                    <option value="350px">Compact (350px)</option>
                    <option value="380px">Standard (380px)</option>
                    <option value="400px">Wide (400px)</option>
                    <option value="450px">Extra Wide (450px)</option>
                  </select>
                </ConfigField>
                <ConfigField label="Height">
                  <select
                    value={config.theme_layout?.height || '600px'}
                    onChange={(e) => setConfig({
                      ...config,
                      theme_layout: { ...config.theme_layout!, height: e.target.value }
                    })}
                    style={inputStyle}
                  >
                    <option value="500px">Short (500px)</option>
                    <option value="550px">Medium (550px)</option>
                    <option value="600px">Standard (600px)</option>
                    <option value="650px">Tall (650px)</option>
                    <option value="700px">Extra Tall (700px)</option>
                  </select>
                </ConfigField>
              </div>
            </ConfigSection>
          </div>

          {/* Border Radius Section */}
          <ConfigSection title="🔲 Border Radius">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              <ConfigField label="Container Radius">
                <select
                  value={config.theme_layout?.borderRadius || '24px'}
                  onChange={(e) => setConfig({
                    ...config,
                    theme_layout: { ...config.theme_layout!, borderRadius: e.target.value }
                  })}
                  style={inputStyle}
                >
                  <option value="0px">Square (0px)</option>
                  <option value="8px">Small (8px)</option>
                  <option value="16px">Medium (16px)</option>
                  <option value="24px">Large (24px)</option>
                  <option value="32px">Extra Large (32px)</option>
                </select>
              </ConfigField>
              <ConfigField label="Button Radius">
                <select
                  value={config.theme_layout?.buttonRadius || '12px'}
                  onChange={(e) => setConfig({
                    ...config,
                    theme_layout: { ...config.theme_layout!, buttonRadius: e.target.value }
                  })}
                  style={inputStyle}
                >
                  <option value="0px">Square (0px)</option>
                  <option value="4px">Tiny (4px)</option>
                  <option value="8px">Small (8px)</option>
                  <option value="12px">Medium (12px)</option>
                  <option value="16px">Large (16px)</option>
                  <option value="9999px">Pill/Round</option>
                </select>
              </ConfigField>
              <ConfigField label="Input Radius">
                <select
                  value={config.theme_layout?.inputRadius || '12px'}
                  onChange={(e) => setConfig({
                    ...config,
                    theme_layout: { ...config.theme_layout!, inputRadius: e.target.value }
                  })}
                  style={inputStyle}
                >
                  <option value="0px">Square (0px)</option>
                  <option value="4px">Tiny (4px)</option>
                  <option value="8px">Small (8px)</option>
                  <option value="12px">Medium (12px)</option>
                  <option value="16px">Large (16px)</option>
                  <option value="9999px">Pill/Round</option>
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
                  <option value="0px">Square (0px)</option>
                  <option value="8px">Rounded Square (8px)</option>
                  <option value="16px">Rounded (16px)</option>
                  <option value="9999px">Circle</option>
                </select>
              </ConfigField>
              <ConfigField label="Bubble Radius">
                <select
                  value={config.theme_layout?.bubbleRadius || '16px'}
                  onChange={(e) => setConfig({
                    ...config,
                    theme_layout: { ...config.theme_layout!, bubbleRadius: e.target.value }
                  })}
                  style={inputStyle}
                >
                  <option value="0px">Square (0px)</option>
                  <option value="8px">Small (8px)</option>
                  <option value="12px">Medium (12px)</option>
                  <option value="16px">Large (16px)</option>
                  <option value="24px">Extra Large (24px)</option>
                </select>
              </ConfigField>
            </div>
          </ConfigSection>
        </div>
      )}
    </div>
  )
}
