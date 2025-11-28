import { useState } from 'react'
import { CaliChatWidget } from '../../lib/Widget/CaliChatWidget'
import { DEFAULT_THEME, WIDGET_SIZES, type WidgetSize } from '../../lib/Widget/utils/theme-manager'
import type { BotConfiguration } from '../../lib/types'

export default function ThemeConfigurator() {
  // Theme state
  const [colors, setColors] = useState({
    primary: DEFAULT_THEME.primary,
    primaryForeground: DEFAULT_THEME.primaryForeground || '#ffffff',
    secondary: DEFAULT_THEME.secondary || '#10b981',
    secondaryForeground: DEFAULT_THEME.secondaryForeground || '#ffffff',
    accent: DEFAULT_THEME.accent || '#8b5cf6',
    accentForeground: DEFAULT_THEME.accentForeground || '#ffffff',
    background: DEFAULT_THEME.background || '#ffffff',
    foreground: DEFAULT_THEME.foreground || '#111827',
    card: DEFAULT_THEME.card || '#f9fafb',
    border: DEFAULT_THEME.border || '#e5e7eb',
    muted: DEFAULT_THEME.muted || '#f3f4f6',
    destructive: DEFAULT_THEME.destructive || '#ef4444',
    success: DEFAULT_THEME.success || '#10b981',
    warning: DEFAULT_THEME.warning || '#f59e0b',
    info: DEFAULT_THEME.info || '#3b82f6',
  })

  const [widgetSize, setWidgetSize] = useState<WidgetSize>('medium')
  const [layout, setLayout] = useState({
    borderRadius: '1rem',
    buttonRadius: '0.75rem',
    containerPadding: '1rem',
    messagePadding: '0.75rem 1rem'
  })

  const [showJson, setShowJson] = useState(false)

  // Generate bot configuration
  const generateBotConfig = (): BotConfiguration => {
    return {
      id: 'preview',
      bot_name: 'Preview Bot',
      avatar: undefined,
      welcome_message: 'Hi! 👋 How can I help you today?',
      theme_colors: {
        primary: colors.primary,
        primaryContent: colors.primaryForeground,
        secondary: colors.secondary,
        secondaryContent: colors.secondaryForeground,
        accent: colors.accent,
        accentContent: colors.accentForeground,
        base100: colors.background,
        base200: colors.card,
        base300: colors.border,
        baseContent: colors.foreground,
        neutral: colors.muted,
        neutralContent: colors.foreground,
        error: colors.destructive,
        success: colors.success,
        warning: colors.warning,
        info: colors.info,
      },
      theme_layout: {
        position: 'bottom-right',
        width: WIDGET_SIZES[widgetSize].width,
        height: WIDGET_SIZES[widgetSize].height,
        borderRadius: layout.borderRadius,
        buttonRadius: layout.buttonRadius,
        inputRadius: layout.buttonRadius,
        avatarRadius: '9999px',
        containerPadding: layout.containerPadding,
        messagePadding: layout.messagePadding,
      },
      feature_chat: {
        enableLiveChat: false,
        enableAI: true,
        autoAssignAgent: false,
        agentTransferEnabled: false,
        showTypingIndicator: true,
        messageDelay: 500,
      },
      feature_ui: {
        fileUpload: false,
        maxFileSize: 5242880,
        emojiPicker: false,
        soundEnabled: false,
        animations: true,
        darkMode: false,
      }
    }
  }

  const exportJson = () => {
    const config = generateBotConfig()
    const jsonStr = JSON.stringify({ bot: config }, null, 2)
    navigator.clipboard.writeText(jsonStr)
    alert('JSON copied to clipboard!')
  }

  const downloadJson = () => {
    const config = generateBotConfig()
    const jsonStr = JSON.stringify({ bot: config }, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bot-theme-config.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Theme Configurator</h1>
          <p className="text-gray-600">Customize your chat widget theme and preview changes in real-time</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls Panel */}
          <div className="space-y-6">
            {/* Size Selection */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Widget Size</h2>
              <div className="flex gap-3">
                {(Object.keys(WIDGET_SIZES) as WidgetSize[]).map((size) => (
                  <button
                    key={size}
                    onClick={() => setWidgetSize(size)}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                      widgetSize === size
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </button>
                ))}
              </div>
              <div className="mt-3 text-sm text-gray-500">
                {widgetSize === 'small' && '320px × 500px'}
                {widgetSize === 'medium' && '380px × 600px'}
                {widgetSize === 'large' && '450px × 700px'}
              </div>
            </div>

            {/* Colors */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Colors</h2>
              <div className="space-y-4">
                {/* Primary */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Primary</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={colors.primary}
                        onChange={(e) => setColors({ ...colors, primary: e.target.value })}
                        className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={colors.primary}
                        onChange={(e) => setColors({ ...colors, primary: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Primary Text</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={colors.primaryForeground}
                        onChange={(e) => setColors({ ...colors, primaryForeground: e.target.value })}
                        className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={colors.primaryForeground}
                        onChange={(e) => setColors({ ...colors, primaryForeground: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Secondary */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Secondary</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={colors.secondary}
                        onChange={(e) => setColors({ ...colors, secondary: e.target.value })}
                        className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={colors.secondary}
                        onChange={(e) => setColors({ ...colors, secondary: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Text</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={colors.secondaryForeground}
                        onChange={(e) => setColors({ ...colors, secondaryForeground: e.target.value })}
                        className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={colors.secondaryForeground}
                        onChange={(e) => setColors({ ...colors, secondaryForeground: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Background & Surface */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Background</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={colors.background}
                        onChange={(e) => setColors({ ...colors, background: e.target.value })}
                        className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={colors.background}
                        onChange={(e) => setColors({ ...colors, background: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Card</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={colors.card}
                        onChange={(e) => setColors({ ...colors, card: e.target.value })}
                        className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={colors.card}
                        onChange={(e) => setColors({ ...colors, card: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Status Colors */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Success</label>
                    <input
                      type="color"
                      value={colors.success}
                      onChange={(e) => setColors({ ...colors, success: e.target.value })}
                      className="h-10 w-full rounded border border-gray-300 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Warning</label>
                    <input
                      type="color"
                      value={colors.warning}
                      onChange={(e) => setColors({ ...colors, warning: e.target.value })}
                      className="h-10 w-full rounded border border-gray-300 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Error</label>
                    <input
                      type="color"
                      value={colors.destructive}
                      onChange={(e) => setColors({ ...colors, destructive: e.target.value })}
                      className="h-10 w-full rounded border border-gray-300 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Layout */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Layout</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Border Radius</label>
                  <input
                    type="text"
                    value={layout.borderRadius}
                    onChange={(e) => setLayout({ ...layout, borderRadius: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="1rem"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Button Radius</label>
                  <input
                    type="text"
                    value={layout.buttonRadius}
                    onChange={(e) => setLayout({ ...layout, buttonRadius: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="0.75rem"
                  />
                </div>
              </div>
            </div>

            {/* Export Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Export Configuration</h2>
              <div className="space-y-3">
                <button
                  onClick={() => setShowJson(!showJson)}
                  className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors"
                >
                  {showJson ? 'Hide JSON' : 'Show JSON'}
                </button>
                <button
                  onClick={exportJson}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Copy to Clipboard
                </button>
                <button
                  onClick={downloadJson}
                  className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                >
                  Download JSON
                </button>
              </div>

              {showJson && (
                <div className="mt-4">
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-96 text-xs">
                    {JSON.stringify({ bot: generateBotConfig() }, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Preview Panel */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Live Preview</h2>
              <div className="flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-8 min-h-[700px]">
                <CaliChatWidget
                  botId="preview"
                  apiBaseUrl=""
                  initialConfig={generateBotConfig()}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
