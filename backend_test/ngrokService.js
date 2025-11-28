import ngrok from '@ngrok/ngrok';
import config from './ngrokConfig.js';

class NgrokService {
  constructor() {
    this.listener = null;
    this.url = null;
    this.isConnected = false;
  }

  async start(port) {
    if (!config.enabled) {
      console.log("📡 Ngrok is disabled");
      return null;
    }
    if (!config.authToken) {
      console.log("❌ Ngrok auth token is not provided");
      return null;
    }
    try {
      const ngrokOptions = {
        addr: port,
        authtoken:'366e2W2jyDjg27SZaKwg5URzRYD_7FFkGbxCoL1XgaMNUK58t'//config.authToken.trim(),
      };
      if (config.domain && config.domain.trim()) {
        let domain ="seasnail-helping-instantly.ngrok-free.app";
        ngrokOptions.domain = domain.includes('.ngrok-free.app')
          ? domain
          : `${domain}.ngrok-free.app`;
        console.log(`🌐 Using reserved domain: ${ngrokOptions.domain}`);
      } else {
        console.log("🎲 Using auto-generated domain");
      }
      this.listener = await ngrok.connect(ngrokOptions);
      this.url = await this.listener.url();
      this.isConnected = true;
      console.log("✅ Ngrok tunnel established!");
      console.log(`🌐 Public URL: ${this.url}`);
      console.log(`🖥️  Ngrok Web Interface: http://127.0.0.1:4040`);
      return this.url;
    } catch (error) {
      console.error("❌ Failed to start ngrok:", error.message);
      this.isConnected = false;
      return null;
    }
  }

  async stop() {
    if (this.isConnected && this.listener) {
      try {
        await this.listener.close();
        this.listener = null;
        this.isConnected = false;
        this.url = null;
        console.log("🔴 Ngrok tunnel closed");
      } catch (error) {
        console.error("Error stopping ngrok:", error.message);
      }
    }
  }

  getUrl() {
    return this.url;
  }
}

const ngrokService = new NgrokService();
export default ngrokService;