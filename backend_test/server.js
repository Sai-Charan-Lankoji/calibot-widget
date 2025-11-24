import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// File paths
const CONFIG_FILE = path.join(__dirname, 'data', 'config.json');
const CONVERSATIONS_FILE = path.join(__dirname, 'data', 'conversations.json');
const MESSAGES_FILE = path.join(__dirname, 'data', 'messages.json');

// Ensure data directory exists
await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });

// Helper to read JSON file
async function readJSON(filePath, defaultValue = {}) {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    await fs.writeFile(filePath, JSON.stringify(defaultValue, null, 2));
    return defaultValue;
  }
}

// Helper to write JSON file
async function writeJSON(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

// Generate UUID
const generateId = () => crypto.randomUUID();

// Logging middleware
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.path}`);
  next();
});

// ============================================
// CONFIG ENDPOINTS
// ============================================

// Get widget configuration
app.get('/api/widget/init/:botId', async (req, res) => {
  try {
    const config = await readJSON(CONFIG_FILE, {
      bots: {},
      faqs: []
    });

    const botId = req.params.botId;
    const bot = config.bots[botId] || config.bots['default'];

    if (!bot) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    console.log(`   ✅ Bot config loaded: ${bot.bot_name}`);

    res.json({
      bot,
      faqs: config.faqs
    });
  } catch (error) {
    console.error('   ❌ Error loading config:', error);
    res.status(500).json({ error: 'Failed to load configuration' });
  }
});

// Update widget configuration (for dev panel)
app.put('/api/widget/config/:botId', async (req, res) => {
  try {
    const config = await readJSON(CONFIG_FILE, { bots: {}, faqs: [] });
    const botId = req.params.botId;

    config.bots[botId] = {
      ...config.bots[botId],
      ...req.body,
      updated_at: new Date().toISOString()
    };

    await writeJSON(CONFIG_FILE, config);

    console.log(`   ✅ Config updated for bot: ${botId}`);

    res.json({ success: true, bot: config.bots[botId] });
  } catch (error) {
    console.error('   ❌ Error updating config:', error);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

// Get all configs (for dev panel)
app.get('/api/admin/configs', async (req, res) => {
  try {
    const config = await readJSON(CONFIG_FILE, { bots: {}, faqs: [] });
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load configurations' });
  }
});

// ============================================
// CONVERSATION ENDPOINTS
// ============================================

// Create conversation
app.post('/api/conversations', async (req, res) => {
  try {
    const conversations = await readJSON(CONVERSATIONS_FILE, {});
    const messages = await readJSON(MESSAGES_FILE, {});

    const conversationId = generateId();
    const sessionToken = generateId();

    const conversation = {
      id: conversationId,
      bot_id: req.body.botId,
      visitor_info: req.body.visitor_info,
      channel: req.body.channel,
      status: 'ACTIVE',
      started_at: new Date().toISOString(),
      attributes: req.body.attributes
    };

    conversations[conversationId] = conversation;
    messages[conversationId] = [];

    await writeJSON(CONVERSATIONS_FILE, conversations);
    await writeJSON(MESSAGES_FILE, messages);

    console.log(`   ✅ Conversation created: ${conversationId}`);
    console.log(`   👤 Visitor: ${conversation.visitor_info.name}`);

    res.json({ conversation, sessionToken });
  } catch (error) {
    console.error('   ❌ Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Send message
app.post('/api/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, sender_type } = req.body;

    const conversations = await readJSON(CONVERSATIONS_FILE, {});
    const messages = await readJSON(MESSAGES_FILE, {});

    if (!conversations[conversationId]) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Store user message
    const userMessage = {
      id: generateId(),
      conversation_id: conversationId,
      sender_type,
      content,
      timestamp: new Date().toISOString()
    };

    if (!messages[conversationId]) {
      messages[conversationId] = [];
    }
    messages[conversationId].push(userMessage);

    console.log(`   💬 Message: "${content.text}"`);

    // Simulate bot response delay
    const typingDelay = Math.random() * 2000 + 1000;
    await new Promise(resolve => setTimeout(resolve, typingDelay));

    // Generate bot response
    const botResponses = [
      "Thanks for your message! I'm here to help. Could you provide more details?",
      "I understand your concern. Let me look into that for you.",
      "That's a great question! Here's what I can tell you about that...",
      "I've checked our system and found some information that might help.",
      "Thanks for the details. I'm processing your request now.",
      "Let me connect you with the right information about that.",
      "I appreciate your patience. Here's what I found...",
      "That's handled differently depending on your account type. Let me explain..."
    ];

    const botMessage = {
      id: generateId(),
      conversation_id: conversationId,
      sender_type: 'BOT',
      content: {
        text: botResponses[Math.floor(Math.random() * botResponses.length)]
      },
      timestamp: new Date().toISOString()
    };

    messages[conversationId].push(botMessage);

    await writeJSON(MESSAGES_FILE, messages);

    console.log(`   🤖 Bot replied`);

    res.json({
      message: userMessage,
      botResponse: botMessage
    });
  } catch (error) {
    const messages = await readJSON(MESSAGES_FILE, {});

    const conversationsWithMessages = Object.values(conversations).map(conv => ({
      ...conv,
      message_count: (messages[conv.id] || []).length,
      last_message: (messages[conv.id] || []).slice(-1)[0]
    }));

    res.json(conversationsWithMessages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load conversations' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Mock API server running on http://localhost:${PORT}`);
  console.log(`📍 Widget init: http://localhost:${PORT}/api/widget/init/{botId}`);
  console.log(`📍 Admin panel: http://localhost:${PORT}/api/admin/configs`);
  console.log(`📂 Data stored in: ${path.join(__dirname, 'data')}`);
});