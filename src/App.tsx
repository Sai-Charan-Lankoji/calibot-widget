import { CaliChatWidget } from "cali-chat-widget";

function App() {
  return (
    <>
      <div style={{ padding: "20px", minHeight: "100vh" }}>
        <h1>Cali Chat Widget Demo</h1>
        <p>Click the chat button in the bottom right to test the new FAQ-first flow!</p>
        <div style={{ marginTop: "40px" }}>
          <h2>Features:</h2>
          <ul>
            <li>FAQ browsing with search</li>
            <li>Visitor information collection</li>
            <li>Live chat with agents</li>
            <li>Session persistence</li>
            <li>Fully customizable with Tailwind</li>
            <li>Mobile responsive</li>
          </ul>
        </div>
      </div>
      <CaliChatWidget
        botId="bot-123"
        apiBaseUrl="http://localhost:3001"
        primaryColor="#3B82F6"
      />
    </>
  );
}

export default App;
