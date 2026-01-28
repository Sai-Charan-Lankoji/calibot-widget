declare interface BotConfiguration {
    id: string;
    bot_name: string;
    welcome_message?: string;
    theme_colors?: ThemeColors;
    theme_typography?: ThemeTypography;
    theme_layout?: ThemeLayout;
    theme_branding?: ThemeBranding;
    feature_chat?: FeatureChat;
    feature_ui?: FeatureUI;
    feature_faq?: FeatureFAQ;
    feature_forms?: FeatureForms;
    created_at?: string;
    updated_at?: string;
}

declare const CaliChatWidgetAPI: {
    init: typeof init;
    destroy: typeof destroy;
    version: string;
};
export { CaliChatWidgetAPI }
export default CaliChatWidgetAPI;

declare function destroy(): void;

declare interface FeatureChat {
    enableLiveChat: boolean;
    enableAI: boolean;
    autoAssignAgent: boolean;
    agentTransferEnabled: boolean;
    showTypingIndicator: boolean;
    messageDelay: number;
}

declare interface FeatureFAQ {
    showFaqList: boolean;
    showSearch: boolean;
    maxVisible: number;
    categorizeByTags: boolean;
}

declare interface FeatureForms {
    requireName: boolean;
    requireEmail: boolean;
    requirePhone: boolean;
    gdprConsent: boolean;
    privacyPolicyUrl: string | null;
    collectInfoTiming: 'upfront' | 'on-demand';
}

declare interface FeatureUI {
    fileUpload: boolean;
    maxFileSize: number;
    emojiPicker: boolean;
    soundEnabled: boolean;
    animations: boolean;
    darkMode: boolean;
}

declare function init(config: WidgetConfig & {
    containerId?: string;
}): void;

declare interface ThemeBranding {
    logoUrl: string | null;
    faviconUrl: string | null;
    avatarUrl: string | null;
    companyName: string | null;
    poweredByText: string;
    showPoweredBy: boolean;
}

declare interface ThemeColors {
    primary: string;
    primaryContent: string;
    secondary: string;
    secondaryContent: string;
    accent: string;
    accentContent: string;
    neutral: string;
    neutralContent: string;
    base100: string;
    base200: string;
    base300: string;
    baseContent: string;
    info: string;
    success: string;
    warning: string;
    error: string;
}

declare interface ThemeLayout {
    position: 'bottom-right' | 'bottom-left';
    width: string;
    height: string;
    borderRadius: string;
    buttonRadius: string;
    inputRadius: string;
    avatarRadius: string;
    bubbleRadius: string;
    containerPadding: string;
    messagePadding: string;
}

declare interface ThemeTypography {
    fontFamily: string;
    fontSizeBase: string;
    fontSizeSmall: string;
    fontSizeLarge: string;
    fontWeightNormal: number;
    fontWeightMedium: number;
    fontWeightBold: number;
    lineHeight: number;
}

declare interface WidgetConfig {
    botId: string;
    apiBaseUrl: string;
    primaryColor?: string;
    botName?: string;
    position?: 'bottom-right' | 'bottom-left';
    welcomeMessage?: string;
    avatarSrc?: string;
    useFavicon?: boolean;
    /** Pre-loaded bot configuration (for preview mode) */
    initialConfig?: BotConfiguration;
    /** Callback when widget is closed */
    onClose?: () => void;
}

export { }
