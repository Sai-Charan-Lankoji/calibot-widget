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

        console.log(`\n--- FAQ ${index + 1} ---`);
        console.log(`Rank: ${faq.metadata.rank}`);
        console.log(`Question: ${faq.question.substring(0, 60)}...`);
        console.log(`Options:`, faq.options);
        console.log(`Raw parent: "${rawParent}"`);

        if (rawParent && typeof rawParent === 'string') {
            const trimmed = rawParent.trim();

            // Handle broken LLM format: "rankYes" instead of "1:Yes"
            if (trimmed.startsWith('rank')) {
                const optionText = trimmed.substring(4).trim();
                console.log(`Detected broken format: "rankXXX" → option = "${optionText}"`);

                const parentQuestion = faqs.find(q =>
                    q.options && q.options.some(opt =>
                        opt.toLowerCase() === optionText.toLowerCase() ||
                        optionText.toLowerCase().includes(opt.toLowerCase()) ||
                        opt.toLowerCase().includes(optionText.toLowerCase())
                    )
                );

                if (parentQuestion) {
                    detectedParentRank = parentQuestion.metadata.rank;
                    console.log(`→ Found parent by option match: Rank ${detectedParentRank}`);
                }
            } else if (trimmed.includes(':')) {
                detectedParentRank = trimmed.split(':')[0].trim();
                console.log(`→ Standard format: Parent rank ${detectedParentRank}`);
            }
        } else {
            console.log(`→ ROOT question (no parent)`);
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

        if (!detectedParentRank) {
            roots.push(node);
        }
    });

    // Link children to parents
    console.log(`\n🔗 Linking children to parents...`);
    let linkedCount = 0;
    Object.values(map).forEach(node => {
        if (node.parent_rank && map[node.parent_rank]) {
            map[node.parent_rank].children.push(node);
            linkedCount++;
            console.log(`Linked rank ${node.rank} → parent rank ${node.parent_rank}`);
        }
    });

    console.log(`\n✅ Tree complete: ${roots.length} roots, ${linkedCount} children linked\n`);
    return roots.sort((a, b) => a.rank - b.rank);
}

// POST /api/chat/:botId/start - Start conversational FAQ session
app.post('/api/chat/:botId/start', async (req, res) => {
    try {
        const { botId } = req.params;
        const sessionId = req.headers['x-session-id'] || Date.now().toString();

        console.log(`\n🚀 Starting chat session for bot: ${botId}`);

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

        console.log(`📋 Found ${faqs.length} approved FAQs`);

        if (faqs.length === 0) {
            return res.json({
                session_id: sessionId,
                greeting: welcomeMessage,
                company_name: botName,
                has_questions: false,
                message: "We're setting up your assistant. Please check back soon!"
            });
        }

        // Build the question tree
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
app.post('/api/chat/:botId/message', async (req, res) => {
    try {
        const { botId } = req.params;
        const { selected_option, user_answer, current_rank } = req.body;

        const userInput = selected_option || user_answer;

        if (!userInput || current_rank === undefined) {
            return res.status(400).json({ error: 'Missing answer or rank' });
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

        const tree = buildQuestionTree(faqs);

        // Build flat map
        const flatMap = {};
        tree.forEach(node => {
            const traverse = (n) => {
                flatMap[n.rank] = n;
                n.children.forEach(traverse);
            };
            traverse(node);
        });

        const currentQuestion = flatMap[current_rank];

        if (!currentQuestion) {
            return res.json({
                end: true,
                message: 'Thank you! Would you like to speak with a specialist?',
                transfer_to_human: true
            });
        }

        let nextQuestion = null;

        // BRANCHING: Validate option
        if (currentQuestion.options && currentQuestion.options.length > 0) {
            const validOption = currentQuestion.options.find(opt =>
                opt.toLowerCase() === selected_option?.toLowerCase() ||
                selected_option?.toLowerCase().includes(opt.toLowerCase()) ||
                opt.toLowerCase().includes(selected_option?.toLowerCase())
            );

            if (!validOption) {
                console.log(`❌ Invalid option: "${selected_option}"`);
                return res.json({
                    error: 'Please choose one of the options below:',
                    repeat_question: {
                        id: currentQuestion.id,
                        rank: currentQuestion.rank,
                        question: currentQuestion.question,
                        options: currentQuestion.options
                    }
                });
            }

            console.log(`✅ Valid option selected: "${validOption}"`);

            // Find next question based on selected option
            nextQuestion = currentQuestion.children.find(child => {
                const parentRank = child.parent_rank;
                if (!parentRank) return false;
                
                // Match exact format: "rank:option"
                return parentRank === `${current_rank}:${validOption}` ||
                       parentRank.toLowerCase().endsWith(`:${validOption.toLowerCase()}`);
            });

            console.log(`🔍 Looking for child with parent_rank: ${current_rank}:${validOption}`);
            console.log(`   Available children:`, currentQuestion.children.map(c => ({
                rank: c.rank,
                parent_rank: c.parent_rank
            })));

            // ❌ REMOVED: Fallback to first child
            // if (!nextQuestion && currentQuestion.children.length > 0) {
            //     nextQuestion = currentQuestion.children[0];
            // }

            // NEW: If no specific follow-up, end conversation
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
            // LINEAR: just next question
            const nextRank = currentQuestion.rank + 1;
            nextQuestion = Object.values(flatMap).find(q => q.rank === nextRank);
            console.log(`→ Linear flow: moving to rank ${nextRank}`);

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

        if (nextQuestion) {
            console.log(`→ Next question: Rank ${nextQuestion.rank}`);
            return res.json({
                acknowledged: 'Got it!',
                next_question: {
                    id: nextQuestion.id,
                    rank: nextQuestion.rank,
                    question: nextQuestion.question,
                    options: nextQuestion.options.length > 0 ? nextQuestion.options : null
                }
            });
        }

        // Fallback end of conversation
        console.log(`🏁 End of conversation (fallback)`);
        return res.json({
            end: true,
            message: 'Thank you! Would you like to connect with a specialist?',
            transfer_to_human: true
        });

    } catch (error) {
        console.error('❌ Error handling message:', error);
        res.status(500).json({ error: 'Something went wrong' });
    }
});