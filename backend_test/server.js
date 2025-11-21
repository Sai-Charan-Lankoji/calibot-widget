import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(cors());
app.use(express.json());

// Mock data
const MOCK_BOT = {
  id: 'demo-bot-123',
  bot_name: 'Demo Support Bot',
  welcome_message: 'Hi! I\'m your demo support assistant. How can I help you today?',
  theme_config: {
    primaryColor: '#3B82F6',
    position: 'bottom-right'
  },
  feature_config: {
    has_live_chat_agents: true,
    agent_transfer_enabled: true
  }
};

const MOCK_FAQS = [
  {
    id: 'faq-1',
    question: 'How do I reset my password?',
    answer: 'To reset your password:\n1. Click "Forgot Password" on the login page\n2. Enter your email address\n3. Check your email for a reset link\n4. Follow the instructions in the email',
    answer_html: '<p>To reset your password:</p><ol><li>Click "Forgot Password" on the login page</li><li>Enter your email address</li><li>Check your email for a reset link</li><li>Follow the instructions in the email</li></ol>',
    tags: ['account', 'password', 'security']
  },
  {
    id: 'faq-2',
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for enterprise customers.',
    tags: ['billing', 'payment', 'pricing']
  },
  {
    id: 'faq-3',
    question: 'How can I upgrade my plan?',
    answer: 'To upgrade your plan:\n1. Go to Settings > Billing\n2. Click "Change Plan"\n3. Select your desired plan\n4. Confirm the upgrade\n\nThe upgrade takes effect immediately!',
    tags: ['billing', 'upgrade', 'plans']
  },
  {
    id: 'faq-4',
    question: 'Is there a mobile app available?',
    answer: 'Yes! Our mobile app is available for both iOS and Android. Download it from the App Store or Google Play Store.',
    tags: ['mobile', 'app', 'features']
  },
  {
    id: 'faq-5',
    question: 'How do I export my data?',
    answer: 'To export your data:\n1. Go to Settings > Data & Privacy\n2. Click "Export Data"\n3. Select the data you want to export\n4. Click "Generate Export"\n5. You\'ll receive an email when it\'s ready',
    tags: ['data', 'export', 'privacy']
  }
];

// Store conversations in memory
const conversations = new Map();
const messages = new Map();

// Widget initialization endpoint
app.get('/api/widget/init/:botId', (req, res) => {
  console.log('📡 Widget init request for bot:', req.params.botId);
  
  setTimeout(() => {
    res.json({
      bot: MOCK_BOT,
      faqs: MOCK_FAQS
    });
  }, 300); // Simulate network delay
});

// Create conversation endpoint
app.post('/api/conversations', (req, res) => {
  console.log('📡 Create conversation request:', req.body);
  
  const conversationId = uuidv4();
  const sessionToken = uuidv4();
  
  const conversation = {
    id: conversationId,
    bot_id: req.body.botId,
    visitor_info: req.body.visitor_info,
    channel: req.body.channel,
    status: 'ACTIVE',
    started_at: new Date().toISOString(),
    attributes: req.body.attributes
  };
  
  conversations.set(conversationId, conversation);
  messages.set(conversationId, []);
  
  setTimeout(() => {
    res.json({
      conversation,
      sessionToken
    });
  }, 500); // Simulate network delay
});

// Send message endpoint with typing simulation
app.post('/api/conversations/:conversationId/messages', async (req, res) => {
  const { conversationId } = req.params;
  const { content, sender_type } = req.body;
  
  console.log('📡 New message in conversation:', conversationId);
  console.log('   Message:', content.text);
  
  const conversation = conversations.get(conversationId);
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }
  
  // Store user message
  const userMessage = {
    id: uuidv4(),
    conversation_id: conversationId,
    sender_type,
    content,
    timestamp: new Date().toISOString()
  };
  
  const conversationMessages = messages.get(conversationId) || [];
  conversationMessages.push(userMessage);
  messages.set(conversationId, conversationMessages);
  
  // Simulate typing delay (1-3 seconds)
  const typingDelay = Math.random() * 2000 + 1000;
  
  await new Promise(resolve => setTimeout(resolve, typingDelay));
  
  // Generate bot response
  const botResponses = [
    "Thanks for your message! I'm here to help. Could you provide more details about your issue?",
    "I understand your concern. Let me look into that for you.",
    "That's a great question! Here's what I can tell you about that...",
    "I've checked our system and found some information that might help.",
    "Thanks for the details. I'm processing your request now.",
    "Let me connect you with the right information about that.",
    "I appreciate your patience. Here's what I found...",
    "That's handled differently depending on your account type. Let me explain..."
  ];
  
  const botMessage = {
    id: uuidv4(),
    conversation_id: conversationId,
    sender_type: 'BOT',
    content: {
      text: botResponses[Math.floor(Math.random() * botResponses.length)]
    },
    timestamp: new Date().toISOString()
  };
  
  conversationMessages.push(botMessage);
  
  res.json({
    message: userMessage,
    botResponse: botMessage
  });
});

// Get conversation messages
app.get('/api/conversations/:conversationId/messages', (req, res) => {
  const { conversationId } = req.params;
  const conversationMessages = messages.get(conversationId) || [];
  
  res.json({
    messages: conversationMessages
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Mock API server running on http://localhost:${PORT}`);
  console.log(`📍 Widget init: http://localhost:${PORT}/api/widget/init/demo-bot-123`);
  console.log(`📍 Conversations: http://localhost:${PORT}/api/conversations`);
});