import express from 'express';
import cors from 'cors';
import { query } from './db.js';
import ngrokService from './ngrokService.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`📡 ${req.method} ${req.path}`);
    next();
});

// Get widget configuration (OPTIMIZED - No FAQs)
app.get('/api/widget/init/:botId', async (req, res) => {
    try {
        const { botId } = req.params;
        
        console.log(`🔧 Initializing widget for bot: ${botId}`);
        
        const { rows: botRows } = await query(
            `SELECT 
                b.id,
                b.name,
                bc.id as config_id,
                bc.bot_name,
                bc.welcome_message,
                bc.theme_colors,
                bc.theme_typography,
                bc.theme_layout,
                bc.theme_branding,
                bc.feature_chat,
                bc.feature_ui,
                bc.feature_faq,
                bc.feature_forms,
                bc.is_active
             FROM bots b 
             LEFT JOIN bot_configurations bc ON b.config_id = bc.id 
             WHERE b.id = $1 AND bc.is_active = true`,
            [botId]
        );

        let bot = botRows[0];

        // Fallback to first active bot if specified bot not found
        if (!bot) {
            console.log(`⚠️ Bot ${botId} not found, using default...`);
            const { rows: defaultBotRows } = await query(
                `SELECT 
                    b.id,
                    b.name,
                    bc.id as config_id,
                    bc.bot_name,
                    bc.welcome_message,
                    bc.theme_colors,
                    bc.theme_typography,
                    bc.theme_layout,
                    bc.theme_branding,
                    bc.feature_chat,
                    bc.feature_ui,
                    bc.feature_faq,
                    bc.feature_forms,
                    bc.is_active
                 FROM bots b 
                 LEFT JOIN bot_configurations bc ON b.config_id = bc.id 
                 WHERE bc.is_active = true
                 LIMIT 1`
            );
            bot = defaultBotRows[0];
        }

        if (!bot) {
            return res.status(404).json({ 
                error: 'No active bot configuration found' 
            });
        }

        // Parse JSONB fields (they come as objects from PostgreSQL)
        const response = {
            bot: {
                id: bot.id,
                name: bot.name,
                bot_name: bot.bot_name || bot.name,
                welcome_message: bot.welcome_message || 'Hi! How can I help you?',
                theme_colors: bot.theme_colors || {},
                theme_typography: bot.theme_typography || {},
                theme_layout: bot.theme_layout || {},
                theme_branding: bot.theme_branding || {},
                feature_chat: bot.feature_chat || {},
                feature_ui: bot.feature_ui || {},
                feature_faq: bot.feature_faq || {},
                feature_forms: bot.feature_forms || {}
            }
        };

        console.log(`   ✅ Bot config loaded: ${response.bot.bot_name}`);
        res.json(response);
        
    } catch (error) {
        console.error('   ❌ Error loading config:', error);
        res.status(500).json({ error: 'Failed to load configuration' });
    }
});

// Update widget configuration
app.put('/api/widget/config/:botId', async (req, res) => {
    try {
        const { botId } = req.params;
        const updates = req.body;

        const { rows: botRows } = await query('SELECT config_id FROM bots WHERE id = $1', [botId]);
        if (botRows.length === 0) return res.status(404).json({ error: 'Bot not found' });

        const configId = botRows[0].config_id;
        const fields = [];
        const values = [];
        let idx = 1;

        const allowedColumns = [
            'welcome_message',
            'theme_colors',
            'theme_typography',
            'theme_layout',
            'theme_branding',
            'feature_chat',
            'feature_ui',
            'feature_faq',
            'feature_forms'
        ];

        for (const [key, value] of Object.entries(updates)) {
            if (allowedColumns.includes(key)) {
                fields.push(`${key} = $${idx++}`);
                values.push(typeof value === 'object' ? JSON.stringify(value) : value);
            }
        }

        if (updates.bot_name) {
            await query('UPDATE bots SET name = $1 WHERE id = $2', [updates.bot_name, botId]);
        }

        if (fields.length > 0) {
            fields.push(`updated_at = NOW()`);
            values.push(configId);
            await query(`UPDATE bot_configurations SET ${fields.join(', ')} WHERE id = $${idx}`, values);
        }

        const { rows: updatedRows } = await query(
            `SELECT 
                b.id, 
                b.name as bot_name, 
                bc.welcome_message,
                bc.theme_colors,
                bc.theme_typography,
                bc.theme_layout,
                bc.theme_branding,
                bc.feature_chat,
                bc.feature_ui,
                bc.feature_faq,
                bc.feature_forms
             FROM bots b 
             LEFT JOIN bot_configurations bc ON b.config_id = bc.id 
             WHERE b.id = $1`,
            [botId]
        );

        console.log(`   ✅ Config updated for bot: ${botId}`);
        res.json({ success: true, bot: updatedRows[0] });
    } catch (error) {
        console.error('   ❌ Error updating config:', error);
        res.status(500).json({ error: 'Failed to update configuration' });
    }
});

// Get all configs
app.get('/api/admin/configs', async (req, res) => {
    try {
        const { rows } = await query(
            `SELECT 
                b.id, 
                b.name as bot_name, 
                bc.welcome_message,
                bc.theme_colors,
                bc.theme_typography,
                bc.theme_layout,
                bc.theme_branding,
                bc.feature_chat,
                bc.feature_ui,
                bc.feature_faq,
                bc.feature_forms
             FROM bots b 
             LEFT JOIN bot_configurations bc ON b.config_id = bc.id`
        );
        const config = { bots: {} };
        rows.forEach(bot => { config.bots[bot.id] = bot; });
        res.json(config);
    } catch (error) {
        console.error('Error loading configs:', error);
        res.status(500).json({ error: 'Failed to load configurations' });
    }
});

// Get all conversations
app.get('/api/admin/conversations', async (req, res) => {
    try {
        const { rows: conversations } = await query(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) as message_count,
        (SELECT row_to_json(m) FROM (
          SELECT content, timestamp FROM messages WHERE conversation_id = c.id ORDER BY timestamp DESC LIMIT 1
        ) m) as last_message
      FROM conversations c ORDER BY c.updated_at DESC NULLS LAST
    `);
        res.json(conversations);
    } catch (error) {
        console.error('Error loading conversations:', error);
        res.status(500).json({ error: 'Failed to load conversations' });
    }
});

// Create conversation  
app.post('/api/conversations', async (req, res) => {
    try {
        const { botId, visitor_info, channel, attributes } = req.body;
        const { rows: convRows } = await query(
            `INSERT INTO conversations (bot_id, email, phone_number, channel, attributes)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [botId, visitor_info?.email || null, visitor_info?.phone || null, channel || 'web', JSON.stringify(attributes || {})]
        );

        const conversation = convRows[0];
        console.log(`   ✅ Conversation created: ${conversation.id}`);
        res.json({ conversation, sessionToken: conversation.id });
    } catch (error) {
        console.error('   ❌ Error creating conversation:', error);
        res.status(500).json({ error: 'Failed to create conversation' });
    }
});

// Get messages
app.get('/api/conversations/:conversationId/messages', async (req, res) => {
    try {
        const { rows: messages } = await query(
            'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY timestamp ASC',
            [req.params.conversationId]
        );
        res.json({ messages });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// Send message
app.post('/api/conversations/:conversationId/messages', async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { content, sender_type } = req.body;

        const { rows: msgRows } = await query(
            `INSERT INTO messages (conversation_id, sender_type, content) VALUES ($1, $2, $3) RETURNING *`,
            [conversationId, sender_type, JSON.stringify(content)]
        );

        const userMessage = msgRows[0];
        console.log(`   💬 Message: "${content.text}"`);
        await query('UPDATE conversations SET updated_at = NOW() WHERE id = $1', [conversationId]);

        let botMessage = null;
        if (sender_type === 'USER') {
            await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
            const botText = ["Thanks for your message! I'm here to help.", "I understand. Could you tell me more?",
                "Let me check that for you.", "That's a good question."][Math.floor(Math.random() * 4)];
            const { rows: botMsgRows } = await query(
                `INSERT INTO messages (conversation_id, sender_type, content) VALUES ($1, 'BOT', $2) RETURNING *`,
                [conversationId, JSON.stringify({ text: botText })]
            );
            botMessage = botMsgRows[0];
            console.log(`   🤖 Bot replied`);
        }

        res.json({ message: userMessage, botResponse: botMessage });
    } catch (error) {
        console.error('   ❌ Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Agent message
app.post('/api/admin/conversations/:conversationId/agent-message', async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { text } = req.body;
        const { rows: msgRows } = await query(
            `INSERT INTO messages (conversation_id, sender_type, content) VALUES ($1, 'AGENT', $2) RETURNING *`,
            [conversationId, JSON.stringify({ text })]
        );
        await query('UPDATE conversations SET updated_at = NOW() WHERE id = $1', [conversationId]);
        res.json(msgRows[0]);
    } catch (error) {
        console.error('Error sending agent message:', error);
        res.status(500).json({ error: 'Failed to send agent message' });
    }
});

// ============================================
// CONVERSATIONAL FAQ CHAT ENDPOINTS
// ============================================

// Build question tree from FAQ metadata (handles branching logic)
function buildQuestionTree(faqs) {
    console.log('🌳 Building question tree - Total FAQs:', faqs.length);
    const map = {};
    const roots = [];

    faqs.forEach((faq, index) => {
        if (!faq.metadata?.rank) {
            console.log(`⚠️ Skipping FAQ ${index} - no rank in metadata`);
            return;
        }

        const rawParent = faq.metadata.parent_question_rank;
        let detectedParentRank = null;

        if (rawParent && typeof rawParent === 'string') {
            const trimmed = rawParent.trim();

            // Handle broken LLM format: "rankYes" instead of "1:Yes"
            if (trimmed.startsWith('rank')) {
                const optionText = trimmed.substring(4).trim();
                const parentQuestion = faqs.find(q =>
                    q.options && q.options.some(opt =>
                        opt.toLowerCase() === optionText.toLowerCase() ||
                        optionText.toLowerCase().includes(opt.toLowerCase())
                    )
                );
                if (parentQuestion) {
                    detectedParentRank = parentQuestion.metadata.rank;
                }
            } else if (trimmed.includes(':')) {
                detectedParentRank = trimmed.split(':')[0].trim();
            }
        }

        const node = {
            id: faq.id,
            rank: faq.metadata.rank,
            question: faq.question,
            options: faq.options || [],
            parent_rank: detectedParentRank,
            children: []
        };

        map[node.rank] = node;
        if (!detectedParentRank) roots.push(node);
    });

    // Link children to parents
    Object.values(map).forEach(node => {
        if (node.parent_rank && map[node.parent_rank]) {
            map[node.parent_rank].children.push(node);
        }
    });

    return roots.sort((a, b) => a.rank - b.rank);
}

// POST /api/chat/:botId/start - Start conversational FAQ session
app.post('/api/chat/:botId/start', async (req, res) => {
    try {
        const { botId } = req.params;
        const sessionId = req.headers['x-session-id'] || Date.now().toString();

        // Get bot configuration
        const { rows: botRows } = await query(
            `SELECT b.id, b.name, bc.welcome_message, bc.bot_name
             FROM bots b
             LEFT JOIN bot_configurations bc ON b.config_id = bc.id
             WHERE b.id = $1`,
            [botId]
        );

        const bot = botRows[0];
        const botName = bot?.bot_name || bot?.name || 'Support Assistant';
        const welcomeMessage = bot?.welcome_message || `Hi! Welcome to ${botName}. How can I assist you today?`;

        // Get approved FAQs with metadata
        const { rows: faqs } = await query(
            `SELECT id, question, answer, options, metadata
             FROM faq
             WHERE bot_id = $1
               AND is_approved = true
               AND metadata IS NOT NULL
             ORDER BY (metadata->>'rank')::int ASC`,
            [botId]
        );

        if (faqs.length === 0) {
            return res.json({
                session_id: sessionId,
                greeting: welcomeMessage,
                company_name: botName,
                has_questions: false,
                message: "We're setting up your assistant. Please check back soon!"
            });
        }

        const tree = buildQuestionTree(faqs);
        const firstQuestion = tree[0];

        res.json({
            session_id: sessionId,
            greeting: welcomeMessage,
            company_name: botName,
            has_questions: true,
            next_question: firstQuestion ? {
                id: firstQuestion.id,
                rank: firstQuestion.rank,
                question: firstQuestion.question,
                options: firstQuestion.options.length > 0 ? firstQuestion.options : null
            } : null
        });

    } catch (error) {
        console.error('❌ Error starting chat:', error);
        res.status(500).json({ error: 'Failed to start chat' });
    }
});

// POST /api/chat/:botId/message - Handle user response in conversation
// POST /api/chat/:botId/message - Handle user response in conversation
// POST /api/chat/:botId/message - Handle user response in conversation
app.post('/api/chat/:botId/message', async (req, res) => {
    try {
        const { botId } = req.params;
        const { selected_option, user_answer, current_rank } = req.body;

        const userInput = selected_option || user_answer;

        if (current_rank === undefined) {
            return res.status(400).json({ error: 'Missing rank' });
        }

        console.log(`\n💬 Processing message - Rank: ${current_rank}, Input: "${userInput}"`);

        // Get FAQs and rebuild tree
        const { rows: faqs } = await query(
            `SELECT id, question, answer, options, metadata
             FROM faq
             WHERE bot_id = $1
               AND is_approved = true
               AND metadata IS NOT NULL
             ORDER BY (metadata->>'rank')::int ASC`,
            [botId]
        );

        if (faqs.length === 0) {
            return res.json({
                end: true,
                message: 'No questions available at this time.'
            });
        }

        const tree = buildQuestionTree(faqs);

        // Build flat map
        const flatMap = {};
        const traverse = (n) => {
            flatMap[n.rank] = n;
            n.children.forEach(traverse);
        };
        tree.forEach(traverse);

        const currentQuestion = flatMap[current_rank];

        if (!currentQuestion) {
            console.log(`❌ No question found for rank ${current_rank}`);
            return res.json({
                end: true,
                message: 'End of conversation flow.',
            });
        }

        let nextQuestion = null;

        // BRANCHING: Handle option-based questions
        if (currentQuestion.options && currentQuestion.options.length > 0) {
            const validOption = currentQuestion.options.find(opt =>
                opt.toLowerCase() === selected_option?.toLowerCase() ||
                selected_option?.toLowerCase().includes(opt.toLowerCase()) ||
                opt.toLowerCase().includes(selected_option?.toLowerCase())
            );

            if (!validOption) {
                console.log(`❌ Invalid option: "${selected_option}"`);
                return res.json({
                    error: 'Invalid option selected',
                    repeat_question: {
                        id: currentQuestion.id,
                        rank: currentQuestion.rank,
                        question: currentQuestion.question,
                        options: currentQuestion.options
                    }
                });
            }

            console.log(`✅ Valid option selected: "${validOption}"`);

            // Robust matching: Try multiple strategies to find the next question
            nextQuestion = currentQuestion.children.find(child => {
                const rawParent = child.parent_rank;
                if (!rawParent) return false;

                // Strategy 1: Exact match with "rank:option" format
                if (rawParent === `${current_rank}:${validOption}`) return true;

                // Strategy 2: Case-insensitive match
                if (rawParent.toLowerCase() === `${current_rank}:${validOption}`.toLowerCase()) return true;

                // Strategy 3: Parse and match parts
                const parts = String(rawParent).split(':');
                const parentPart = parts[0]?.trim();
                const optionPart = parts.slice(1).join(':').trim();

                if (parentPart && String(parentPart) === String(current_rank)) {
                    if (!optionPart) return true; // Match rank only
                    
                    const lhs = optionPart.toLowerCase();
                    const rhs = validOption.toLowerCase();
                    
                    // Exact match
                    if (lhs === rhs) return true;
                    
                    // Partial match (contains)
                    if (lhs.includes(rhs) || rhs.includes(lhs)) return true;
                }

                // Strategy 4: Fuzzy match on raw parent_rank
                if (rawParent.toLowerCase().includes(validOption.toLowerCase())) return true;

                return false;
            });

            console.log(`🔍 Looking for child with parent_rank matching: ${current_rank}:${validOption}`);
            console.log(`   Available children:`, currentQuestion.children.map(c => ({
                rank: c.rank,
                parent_rank: c.parent_rank
            })));

            // Fallback to first child if no exact match found
            if (!nextQuestion && currentQuestion.children.length > 0) {
                console.log(`⚠️  No exact child match for option="${validOption}" on rank=${current_rank}`);
                console.log(`    Falling back to first child: rank=${currentQuestion.children[0].rank}`);
                nextQuestion = currentQuestion.children[0];
            }

            // If still no next question, end the conversation
            if (!nextQuestion) {
                console.log(`🏁 No follow-up question for option: "${validOption}"`);
                return res.json({
                    acknowledged: 'Got it!',
                    end: true,
                    message: 'Thank you for providing that information. Would you like to speak with one of our specialists?',
                    transfer_to_human: true
                });
            }

        } else {
            // LINEAR / TEXT INPUT: Move to next rank or end
            
            // Detect email input (terminal state)
            const emailLike = typeof user_answer === 'string' && /\S+@\S+\.\S+/.test(user_answer.trim());
            if (emailLike) {
                console.log(`📧 Detected email input for rank ${current_rank}: ${user_answer.trim()}. Ending flow.`);
                return res.json({ 
                    acknowledged: 'Thank you!',
                    end: true, 
                    message: "Thank you! This completes the conversation." 
                });
            }

            const nextRank = currentQuestion.rank + 1;
            nextQuestion = Object.values(flatMap).find(q => q.rank === nextRank);
            console.log(`→ Linear flow: moving to rank ${nextRank}`);

            // Log available ranks for debugging
            if (!nextQuestion) {
                console.log(`ℹ️  Question rank ${current_rank} has no options (text input). No next question found (rank ${nextRank}).`);
                console.log(`    Available question ranks: ${Object.keys(flatMap).join(', ')}`);
            } else {
                // Prevent repeating email questions
                const nextIsEmailQuestion = /email|e-mail|best email/i.test(nextQuestion.question || '');
                if (nextIsEmailQuestion) {
                    console.log(`ℹ️  Next question (rank ${nextQuestion.rank}) appears to be an email capture. Finishing instead of repeating.`);
                    return res.json({ 
                        acknowledged: 'Thank you!',
                        end: true, 
                        message: "Thank you! This completes the conversation." 
                    });
                }
            }

            // If no next question in linear flow, end conversation
            if (!nextQuestion) {
                console.log(`🏁 No next question in linear flow`);
                return res.json({
                    acknowledged: 'Got it!',
                    end: true,
                    message: 'Thank you for the information. Would you like to speak with a specialist?',
                    transfer_to_human: true
                });
            }
        }

        // Return next question
        if (nextQuestion) {
            console.log(`→ Next question: Rank ${nextQuestion.rank}`);
            return res.json({
                acknowledged: 'Got it!',
                next_question: {
                    id: nextQuestion.id,
                    rank: nextQuestion.rank,
                    question: nextQuestion.question,
                    options: nextQuestion.options.length > 0 ? nextQuestion.options : null,
                    is_multi_select: nextQuestion.options.length > 0
                }
            });
        }

        // Fallback end of conversation
        console.log(`🏁 End of conversation (fallback)`);
        return res.json({
            acknowledged: 'Thank you!',
            end: true,
            message: 'Thank you! Would you like to connect with a specialist?',
            transfer_to_human: true
        });

    } catch (error) {
        console.error('❌ Error handling message:', error);
        res.status(500).json({ error: 'Failed to process message' });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
    console.log(`🚀 API server running on http://localhost:${PORT}`);
    console.log(`📡 Connected to PostgreSQL`);
    await ngrokService.start(PORT);
});
