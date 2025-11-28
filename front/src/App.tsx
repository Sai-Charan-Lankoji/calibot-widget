import { useState, useEffect } from "react"
import { BrowserRouter, Routes, Route, Link } from "react-router-dom"
import { CaliChatWidget } from "../lib/Widget/CaliChatWidget"
import ThemeConfigurator from "./pages/ThemeConfigurator"
import "../lib/Widget/globals.css";

function HomePage() {
  const [error, setError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Just set ready state - CaliChatWidget handles its own API calls
    setIsReady(true)
  }, [])

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading widget...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo content */}
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Cali Chat Widget Demo</h1>
        <p className="text-gray-600 mb-4">
          The chat widget will appear in the bottom-right corner.
        </p>
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-3">Features</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Real-time chat interface</li>
            <li>Customizable themes</li>
            <li>Conversational FAQ support</li>
            <li>Offline mode fallback</li>
            <li>Live agent handoff</li>
          </ul>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">🎨 Want to customize the theme?</h3>
          <p className="text-blue-800 mb-4">
            Try our interactive theme configurator to preview and export custom themes!
          </p>
          <Link
            to="/config"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Open Theme Configurator →
          </Link>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            <strong>Note:</strong> {error}
          </div>
        )}
      </div>

      {/* Widget - handles its own errors internally */}
      <CaliChatWidget
        botId="bbf342b4-832f-4793-93c3-23d1c91adf95"
        apiBaseUrl="http://localhost:3001"
        position="bottom-right"
        useFavicon={false}
      />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/config" element={<ThemeConfigurator />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
