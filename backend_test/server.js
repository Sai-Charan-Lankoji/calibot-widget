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

// ============================================
// WIDGET CONFIGURATION ENDPOINTS
// ============================================

// Get widget configuration (OPTIMIZED - No FAQs)
app.get('/api/widget/init/:botId', async (req, res) => {
    try {
        const { botId } = req.params;
        
        console.log(`🔧 Initializing widget for bot: ${botId}`);
        
        const { rows: botRows } = await query(
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
                    b.name as bot_name,
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

        // Parse JSONB fields
        const response = {
            bot: {
                id: bot.id,
                bot_name: bot.bot_name,
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

        // Update bot name in bots table
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

// ============================================
// LIVE CHAT SESSION ENDPOINTS
// ============================================

// Start new live chat session
app.post('/api/live-chat/session/start', async (req, res) => {
    try {
        const { bot_id, visitor_id, visitor_name, visitor_email, metadata } = req.body;
        
        console.log(`🚀 Starting live chat session for bot: ${bot_id}`);
        
        // Check if visitor already has active session
        const { rows: existingSessions } = await query(
            `SELECT id FROM live_chat_session 
             WHERE visitor_id = $1 AND bot_id = $2 AND status = 'ACTIVE'`,
            [visitor_id, bot_id]
        );
        
        if (existingSessions.length > 0) {
            const sessionId = existingSessions[0].id;
            console.log(`   ♻️ Resuming existing session: ${sessionId}`);
            return res.json({ 
                session_id: sessionId,
                session_token: sessionId,
                resumed: true 
            });
        }
        
        // Create new session
        const { rows } = await query(
            `INSERT INTO live_chat_session 
             (bot_id, visitor_id, visitor_name, visitor_email, status, metadata)
             VALUES ($1, $2, $3, $4, 'ACTIVE', $5)
             RETURNING id`,
            [bot_id, visitor_id, visitor_name, visitor_email, JSON.stringify(metadata || {})]
        );
        
        const sessionId = rows[0].id;
        
        console.log(`   ✅ New live chat session created: ${sessionId}`);
        
        res.json({ 
            session_id: sessionId,
            session_token: sessionId,
            resumed: false 
        });
    } catch (error) {
        console.error('   ❌ Error creating session:', error);
        res.status(500).json({ error: 'Failed to create session' });
    }
});

// Get session details
app.get('/api/live-chat/session/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        const { rows } = await query(
            'SELECT * FROM live_chat_session WHERE id = $1',
            [sessionId]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        res.json({ session: rows[0] });
    } catch (error) {
        console.error('Error fetching session:', error);
        res.status(500).json({ error: 'Failed to fetch session' });
    }
});

// Send message in live chat session
app.post('/api/live-chat/session/:sessionId/message', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { content, sender_type, message_type } = req.body;
        
        // Verify session exists and is active
        const { rows: sessions } = await query(
            'SELECT * FROM live_chat_session WHERE id = $1',
            [sessionId]
        );
        
        if (sessions.length === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        const session = sessions[0];
        
        // Insert message
        const { rows: msgRows } = await query(
            `INSERT INTO live_chat_message 
             (session_id, sender_type, sender_name, message_type, content)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [
                sessionId, 
                sender_type || 'VISITOR',
                session.visitor_name,
                message_type || 'TEXT',
                content
            ]
        );
        
        const message = msgRows[0];
        
        // Update session timestamp
        await query(
            'UPDATE live_chat_session SET updated_at = NOW() WHERE id = $1',
            [sessionId]
        );
        
        console.log(`   💬 Message sent in session ${sessionId}`);
        
        // If bot should respond
        let botMessage = null;
        if (sender_type === 'VISITOR' && session.bot_chat_started && session.status === 'ACTIVE') {
            await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
            
            const botResponses = [
                "Thanks for your message! I'm here to help.",
                "I understand. Could you tell me more?",
                "Let me check that for you.",
                "That's a good question. Let me assist you with that."
            ];
            const botText = botResponses[Math.floor(Math.random() * botResponses.length)];
            
            const { rows: botMsgRows } = await query(
                `INSERT INTO live_chat_message 
                 (session_id, sender_type, sender_name, message_type, content)
                 VALUES ($1, 'BOT', $2, 'TEXT', $3)
                 RETURNING *`,
                [sessionId, 'Support Bot', botText]
            );
            
            botMessage = botMsgRows[0];
            console.log(`   🤖 Bot replied in session ${sessionId}`);
        }
        
        res.json({ 
            message,
            bot_response: botMessage
        });
    } catch (error) {
        console.error('   ❌ Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Get messages for a session
app.get('/api/live-chat/session/:sessionId/messages', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { after } = req.query;
        
        let queryText = `
            SELECT * FROM live_chat_message 
            WHERE session_id = $1
        `;
        const params = [sessionId];
        
        if (after) {
            queryText += ` AND created_at > $2`;
            params.push(after);
        }
        
        queryText += ` ORDER BY created_at ASC`;
        
        const { rows } = await query(queryText, params);
        
        res.json({ messages: rows });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// Transfer session to agent
app.post('/api/live-chat/session/:sessionId/transfer', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { reason } = req.body;
        
        // Get session details
        const { rows: sessions } = await query(
            'SELECT bot_id, tenant_id FROM live_chat_session WHERE id = $1',
            [sessionId]
        );
        
        if (sessions.length === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        const session = sessions[0];
        
        // Update session status
        await query(
            `UPDATE live_chat_session 
             SET status = 'TRANSFERRED', 
                 transferred_to_agent = NOW(),
                 bot_chat_started = false
             WHERE id = $1`,
            [sessionId]
        );
        
        // Add to queue
        const { rows: queueRows } = await query(
            `INSERT INTO live_chat_queue 
             (session_id, bot_id, tenant_id, status, request_reason, position)
             VALUES ($1, $2, $3, 'PENDING', $4, 
                     (SELECT COALESCE(MAX(position), 0) + 1 FROM live_chat_queue WHERE status = 'PENDING'))
             RETURNING *`,
            [sessionId, session.bot_id, session.tenant_id || session.bot_id, reason || 'User requested human agent']
        );
        
        // Send system message
        await query(
            `INSERT INTO live_chat_message 
             (session_id, sender_type, message_type, content)
             VALUES ($1, 'SYSTEM', 'SYSTEM', $2)`,
            [sessionId, 'Transferring you to a human agent. Please wait...']
        );
        
        console.log(`   🔄 Session ${sessionId} transferred to agent queue`);
        
        res.json({ 
            success: true,
            queue_position: queueRows[0].position,
            message: 'Session transferred to agent queue'
        });
    } catch (error) {
        console.error('   ❌ Error transferring session:', error);
        res.status(500).json({ error: 'Failed to transfer session' });
    }
});

// End session
app.post('/api/live-chat/session/:sessionId/end', async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        await query(
            `UPDATE live_chat_session 
             SET status = 'CLOSED', ended_at = NOW()
             WHERE id = $1`,
            [sessionId]
        );
        
        // Remove from queue if present
        await query(
            `UPDATE live_chat_queue 
             SET status = 'COMPLETED'
             WHERE session_id = $1`,
            [sessionId]
        );
        
        console.log(`   ✅ Session ended: ${sessionId}`);
        
        res.json({ success: true });
    } catch (error) {
        console.error('   ❌ Error ending session:', error);
        res.status(500).json({ error: 'Failed to end session' });
    }
});

// ============================================
// ADMIN ENDPOINTS
// ============================================

// Get all live chat sessions
app.get('/api/admin/live-chat/sessions', async (req, res) => {
    try {
        const { rows: sessions } = await query(`
            SELECT s.*, 
                (SELECT COUNT(*) FROM live_chat_message m WHERE m.session_id = s.id) as message_count,
                (SELECT row_to_json(m) FROM (
                    SELECT content, created_at, sender_type FROM live_chat_message 
                    WHERE session_id = s.id ORDER BY created_at DESC LIMIT 1
                ) m) as last_message
            FROM live_chat_session s 
            ORDER BY s.updated_at DESC
        `);
        res.json(sessions);
    } catch (error) {
        console.error('Error loading sessions:', error);
        res.status(500).json({ error: 'Failed to load sessions' });
    }
});

// Agent sends message
app.post('/api/admin/live-chat/session/:sessionId/agent-message', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { text, agent_name } = req.body;
        
        const { rows: msgRows } = await query(
            `INSERT INTO live_chat_message 
             (session_id, sender_type, sender_name, message_type, content)
             VALUES ($1, 'AGENT', $2, 'TEXT', $3)
             RETURNING *`,
            [sessionId, agent_name || 'Agent', text]
        );
        
        await query(
            'UPDATE live_chat_session SET updated_at = NOW() WHERE id = $1',
            [sessionId]
        );
        
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

        const { rows: botRows } = await query(
            `SELECT b.id, b.name, bc.welcome_message
             FROM bots b
             LEFT JOIN bot_configurations bc ON b.config_id = bc.id
             WHERE b.id = $1`,
            [botId]
        );

        const bot = botRows[0];
        const botName = bot?.name || 'Support Assistant';
        const welcomeMessage = bot?.welcome_message || `Hi! Welcome to ${botName}. How can I assist you today?`;

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

app.post('/api/chat/:botId/message', async (req, res) => {
    try {
        const { botId } = req.params;
        const { selected_option, user_answer, current_rank } = req.body;

        const userInput = selected_option || user_answer;

        if (current_rank === undefined) {
            return res.status(400).json({ error: 'Missing rank' });
        }

        console.log(`\n💬 Processing message - Rank: ${current_rank}, Input: "${userInput}"`);

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

            nextQuestion = currentQuestion.children.find(child => {
                const rawParent = child.parent_rank;
                if (!rawParent) return false;

                if (rawParent === `${current_rank}:${validOption}`) return true;
                if (rawParent.toLowerCase() === `${current_rank}:${validOption}`.toLowerCase()) return true;

                const parts = String(rawParent).split(':');
                const parentPart = parts[0]?.trim();
                const optionPart = parts.slice(1).join(':').trim();

                if (parentPart && String(parentPart) === String(current_rank)) {
                    if (!optionPart) return true;
                    
                    const lhs = optionPart.toLowerCase();
                    const rhs = validOption.toLowerCase();
                    
                    if (lhs === rhs) return true;
                    if (lhs.includes(rhs) || rhs.includes(lhs)) return true;
                }

                if (rawParent.toLowerCase().includes(validOption.toLowerCase())) return true;

                return false;
            });

            if (!nextQuestion && currentQuestion.children.length > 0) {
                console.log(`⚠️  No exact child match, using first child`);
                nextQuestion = currentQuestion.children[0];
            }

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
            const emailLike = typeof user_answer === 'string' && /\S+@\S+\.\S+/.test(user_answer.trim());
            if (emailLike) {
                console.log(`📧 Detected email input, ending flow`);
                return res.json({ 
                    acknowledged: 'Thank you!',
                    end: true, 
                    message: "Thank you! This completes the conversation." 
                });
            }

            const nextRank = currentQuestion.rank + 1;
            nextQuestion = Object.values(flatMap).find(q => q.rank === nextRank);

            if (nextQuestion && /email|e-mail|best email/i.test(nextQuestion.question || '')) {
                return res.json({ 
                    acknowledged: 'Thank you!',
                    end: true, 
                    message: "Thank you! This completes the conversation." 
                });
            }

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
