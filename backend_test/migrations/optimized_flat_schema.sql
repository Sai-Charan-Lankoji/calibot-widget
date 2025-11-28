-- ============================================
-- OPTIMIZED SCHEMA: Multiple Focused Columns (Better Design!)
-- ============================================
-- This uses separate columns for each config area instead of deeply nested JSON
-- Benefits: Better performance, easier queries, better indexing

BEGIN;

-- ============================================
-- 1. Add new focused columns to bot_configurations
-- ============================================

-- Add theme_colors column
ALTER TABLE bot_configurations
    ADD COLUMN IF NOT EXISTS theme_colors JSONB DEFAULT '{"primary":"oklch(67% 0.182 276.935)","primaryContent":"oklch(25% 0.09 281.288)","secondary":"oklch(70% 0.01 56.259)","secondaryContent":"oklch(14% 0.004 49.25)","accent":"oklch(78% 0.154 211.53)","accentContent":"oklch(30% 0.056 229.695)","neutral":"oklch(14% 0 0)","neutralContent":"oklch(98% 0 0)","base100":"oklch(100% 0 0)","base200":"oklch(96% 0 0)","base300":"oklch(92% 0 0)","baseContent":"oklch(14% 0 0)","info":"oklch(71% 0.143 215.221)","success":"oklch(72% 0.219 149.579)","warning":"oklch(76% 0.188 70.08)","error":"oklch(65% 0.241 354.308)"}'::jsonb;

-- Add theme_typography column
ALTER TABLE bot_configurations
    ADD COLUMN IF NOT EXISTS theme_typography JSONB DEFAULT '{"fontFamily":"Inter, system-ui, sans-serif","fontSizeBase":"14px","fontSizeSmall":"12px","fontSizeLarge":"16px","fontWeightNormal":400,"fontWeightMedium":500,"fontWeightBold":600,"lineHeight":1.5}'::jsonb;

-- Add theme_layout column
ALTER TABLE bot_configurations
    ADD COLUMN IF NOT EXISTS theme_layout JSONB DEFAULT '{"position":"bottom-right","width":"380px","height":"600px","borderRadius":"1rem","buttonRadius":"0.75rem","inputRadius":"0.75rem","avatarRadius":"9999px","containerPadding":"16px","messagePadding":"12px 16px"}'::jsonb;

-- Add theme_branding column
ALTER TABLE bot_configurations
    ADD COLUMN IF NOT EXISTS theme_branding JSONB DEFAULT '{"logoUrl":null,"faviconUrl":null,"avatarUrl":null,"companyName":null,"poweredByText":"Powered by Calibrage","showPoweredBy":true}'::jsonb;

-- Add feature_chat column
ALTER TABLE bot_configurations
    ADD COLUMN IF NOT EXISTS feature_chat JSONB DEFAULT '{"enableLiveChat":true,"enableAI":false,"autoAssignAgent":true,"agentTransferEnabled":true,"showTypingIndicator":true,"messageDelay":800}'::jsonb;

-- Add feature_ui column
ALTER TABLE bot_configurations
    ADD COLUMN IF NOT EXISTS feature_ui JSONB DEFAULT '{"fileUpload":false,"maxFileSize":5242880,"emojiPicker":true,"soundEnabled":true,"animations":true,"darkMode":false}'::jsonb;

-- Add feature_faq column
ALTER TABLE bot_configurations
    ADD COLUMN IF NOT EXISTS feature_faq JSONB DEFAULT '{"showFaqList":true,"showSearch":true,"maxVisible":5,"categorizeByTags":false}'::jsonb;

-- Add feature_forms column
ALTER TABLE bot_configurations
    ADD COLUMN IF NOT EXISTS feature_forms JSONB DEFAULT '{"requireName":true,"requireEmail":true,"requirePhone":false,"gdprConsent":false,"privacyPolicyUrl":null}'::jsonb;

-- ============================================
-- 2. Create indexes for better query performance
-- ============================================

-- Index on commonly queried theme properties
CREATE INDEX IF NOT EXISTS idx_theme_colors_primary 
    ON bot_configurations USING GIN (theme_colors);

CREATE INDEX IF NOT EXISTS idx_feature_chat 
    ON bot_configurations USING GIN (feature_chat);

CREATE INDEX IF NOT EXISTS idx_tenant_active 
    ON bot_configurations (tenant_id, is_active) 
    WHERE is_active = true;

-- ============================================
-- 3. Migrate existing data from old theme_config
-- ============================================

-- Migrate colors from old theme_config
UPDATE bot_configurations
SET theme_colors = jsonb_build_object(
    'primary', COALESCE(theme_config->'colors'->>'primary', 'oklch(67% 0.182 276.935)'),
    'primaryContent', COALESCE(theme_config->'colors'->>'primaryContent', 'oklch(25% 0.09 281.288)'),
    'secondary', COALESCE(theme_config->'colors'->>'secondary', 'oklch(70% 0.01 56.259)'),
    'secondaryContent', COALESCE(theme_config->'colors'->>'secondaryContent', 'oklch(14% 0.004 49.25)'),
    'accent', COALESCE(theme_config->'colors'->>'accent', 'oklch(78% 0.154 211.53)'),
    'accentContent', COALESCE(theme_config->'colors'->>'accentContent', 'oklch(30% 0.056 229.695)'),
    'neutral', COALESCE(theme_config->'colors'->>'neutral', 'oklch(14% 0 0)'),
    'neutralContent', COALESCE(theme_config->'colors'->>'neutralContent', 'oklch(98% 0 0)'),
    'base100', COALESCE(theme_config->'colors'->>'base100', 'oklch(100% 0 0)'),
    'base200', COALESCE(theme_config->'colors'->>'base200', 'oklch(96% 0 0)'),
    'base300', COALESCE(theme_config->'colors'->>'base300', 'oklch(92% 0 0)'),
    'baseContent', COALESCE(theme_config->'colors'->>'baseContent', 'oklch(14% 0 0)'),
    'info', COALESCE(theme_config->'colors'->>'info', 'oklch(71% 0.143 215.221)'),
    'success', COALESCE(theme_config->'colors'->>'success', 'oklch(72% 0.219 149.579)'),
    'warning', COALESCE(theme_config->'colors'->>'warning', 'oklch(76% 0.188 70.08)'),
    'error', COALESCE(theme_config->'colors'->>'error', 'oklch(65% 0.241 354.308)')
)
WHERE theme_config IS NOT NULL;

-- Migrate typography
UPDATE bot_configurations
SET theme_typography = jsonb_build_object(
    'fontFamily', COALESCE(theme_config->'typography'->>'fontFamily', 'Inter, system-ui, sans-serif'),
    'fontSizeBase', COALESCE(theme_config->'typography'->>'fontSizeBase', '14px'),
    'fontSizeSmall', COALESCE(theme_config->'typography'->>'fontSizeSmall', '12px'),
    'fontSizeLarge', COALESCE(theme_config->'typography'->>'fontSizeLarge', '16px'),
    'fontWeightNormal', COALESCE((theme_config->'typography'->>'fontWeightNormal')::int, 400),
    'fontWeightMedium', COALESCE((theme_config->'typography'->>'fontWeightMedium')::int, 500),
    'fontWeightBold', COALESCE((theme_config->'typography'->>'fontWeightBold')::int, 600),
    'lineHeight', COALESCE((theme_config->'typography'->>'lineHeightBase')::numeric, 1.5)
)
WHERE theme_config IS NOT NULL;

-- Migrate layout
UPDATE bot_configurations
SET theme_layout = jsonb_build_object(
    'position', COALESCE(theme_config->'layout'->>'position', theme_config->>'position', 'bottom-right'),
    'width', COALESCE(theme_config->'layout'->>'width', '380px'),
    'height', COALESCE(theme_config->'layout'->>'height', '600px'),
    'borderRadius', COALESCE(theme_config->'borderRadius'->>'widget', theme_config->>'borderRadius', '1rem'),
    'buttonRadius', COALESCE(theme_config->'borderRadius'->>'button', '0.75rem'),
    'inputRadius', COALESCE(theme_config->'borderRadius'->>'input', '0.75rem'),
    'avatarRadius', COALESCE(theme_config->'borderRadius'->>'avatar', '9999px'),
    'containerPadding', COALESCE(theme_config->'spacing'->>'containerPadding', '16px'),
    'messagePadding', COALESCE(theme_config->'spacing'->>'messagePadding', '12px 16px')
)
WHERE theme_config IS NOT NULL;

-- Migrate branding
UPDATE bot_configurations
SET theme_branding = jsonb_build_object(
    'logoUrl', theme_config->'branding'->>'logoUrl',
    'faviconUrl', theme_config->'branding'->>'faviconUrl',
    'avatarUrl', COALESCE(theme_config->'branding'->>'avatarUrl', theme_config->>'avatarSrc'),
    'companyName', NULL,
    'poweredByText', COALESCE(theme_config->'branding'->>'poweredByText', 'Powered by Calibrage'),
    'showPoweredBy', COALESCE((theme_config->'branding'->>'showPoweredBy')::boolean, true)
)
WHERE theme_config IS NOT NULL;

-- Migrate chat features
UPDATE bot_configurations
SET feature_chat = jsonb_build_object(
    'enableLiveChat', COALESCE(has_live_chat_agents, true),
    'enableAI', COALESCE(has_ai_assistance, false),
    'autoAssignAgent', COALESCE(auto_assign_to_agent, true),
    'agentTransferEnabled', COALESCE(agent_transfer_enabled, true),
    'showTypingIndicator', COALESCE((feature_config->'chat'->>'showTypingIndicator')::boolean, true),
    'messageDelay', COALESCE((feature_config->'chat'->>'messageDelay')::int, 800)
);

-- Migrate UI features
UPDATE bot_configurations
SET feature_ui = jsonb_build_object(
    'fileUpload', COALESCE((feature_config->'features'->>'fileUpload')::boolean, false),
    'maxFileSize', COALESCE((feature_config->'features'->>'maxFileSize')::int, 5242880),
    'emojiPicker', COALESCE((feature_config->'features'->>'emojiPicker')::boolean, true),
    'soundEnabled', COALESCE((feature_config->'notifications'->>'soundEnabled')::boolean, true),
    'animations', COALESCE((theme_config->'animations'->>'enableAnimations')::boolean, true),
    'darkMode', false
)
WHERE feature_config IS NOT NULL OR theme_config IS NOT NULL;

-- Migrate FAQ features
UPDATE bot_configurations
SET feature_faq = jsonb_build_object(
    'showFaqList', COALESCE((feature_config->'faq'->>'showFaqList')::boolean, true),
    'showSearch', COALESCE((feature_config->'faq'->>'showSearch')::boolean, true),
    'maxVisible', COALESCE((feature_config->'faq'->>'maxVisibleFaqs')::int, 5),
    'categorizeByTags', COALESCE((feature_config->'faq'->>'categorizeByTags')::boolean, false)
)
WHERE feature_config IS NOT NULL;

-- Migrate form requirements
UPDATE bot_configurations
SET feature_forms = jsonb_build_object(
    'requireName', COALESCE((feature_config->'forms'->>'requireName')::boolean, true),
    'requireEmail', COALESCE((feature_config->'forms'->>'requireEmail')::boolean, true),
    'requirePhone', COALESCE((feature_config->'forms'->>'requirePhone')::boolean, false),
    'gdprConsent', COALESCE((feature_config->'forms'->>'gdprConsent')::boolean, false),
    'privacyPolicyUrl', feature_config->'forms'->>'privacyPolicyUrl'
)
WHERE feature_config IS NOT NULL;

-- ============================================
-- 4. Optional: Drop old columns (after verifying migration)
-- ============================================
-- UNCOMMENT THESE AFTER VERIFYING THE MIGRATION WORKED!
-- ALTER TABLE bot_configurations DROP COLUMN IF EXISTS theme_config;
-- ALTER TABLE bot_configurations DROP COLUMN IF EXISTS feature_config;

-- ============================================
-- 5. Verify the migration
-- ============================================

SELECT 
    id,
    bot_name,
    theme_colors->>'primary' as primary_color,
    theme_typography->>'fontFamily' as font,
    theme_layout->>'position' as position,
    feature_chat->>'enableLiveChat' as live_chat,
    feature_ui->>'fileUpload' as file_upload,
    feature_faq->>'showFaqList' as show_faq
FROM bot_configurations
LIMIT 5;

COMMIT;

-- ============================================
-- Example Query: How to use the new structure
-- ============================================

-- Much simpler queries now!
-- Get all bots with live chat enabled
SELECT id, bot_name 
FROM bot_configurations 
WHERE feature_chat->>'enableLiveChat' = 'true';

-- Get bots with specific primary color
SELECT id, bot_name 
FROM bot_configurations 
WHERE theme_colors->>'primary' = 'oklch(67% 0.182 276.935)';

-- Update just the primary color (no nested path needed!)
UPDATE bot_configurations 
SET theme_colors = jsonb_set(theme_colors, '{primary}', '"oklch(70% 0.2 280)"')
WHERE id = 'some-bot-id';
