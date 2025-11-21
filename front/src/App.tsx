import { CaliChatWidget } from "cali-chat-widget";

function App() {
  return (
    <>
      <div style={{ padding: "20px", minHeight: "100vh" }}>
        <h1>Cali Chat Widget Demo</h1>
        <p>Click the chat button in the bottom right to test!</p>
        <div style={{ marginTop: "40px" }}>
          <h2>Testing Features:</h2>
          <ul>
            <li>✅ FAQ browsing with search</li>
            <li>✅ Visitor information collection</li>
            <li>✅ Live chat with agents</li>
            <li>✅ Session persistence</li>
            <li>✅ Color customization</li>
            <li>✅ Position testing</li>
          </ul>

          <h2>Test Different Configurations:</h2>
          <p>Edit the props below in src/App.tsx to test different setups</p>
        </div>
      </div>
      
      {/* Development Widget */}
      <CaliChatWidget
        botId="demo-bot-123"
        apiBaseUrl="http://localhost:3001" // Your backend URL
        primaryColor="#3B82F6"
        botName="Dev1 Bot"
        welcomeMessage="Welcome to development mode!"
        position="bottom-right"
      />
    </>
  );
}

export default App;
