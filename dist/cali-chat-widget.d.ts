export declare const CaliChatWidgetAPI: {
    init: typeof init;
};

declare function init(config: WidgetConfig & {
    containerId?: string;
}): void;

declare interface WidgetConfig {
    botId: string;
    apiBaseUrl: string;
    primaryColor?: string;
    avatarSrc?: string;
    botName?: string;
    welcomeMessage?: string;
    position?: 'bottom-right' | 'bottom-left';
    useFavicon?: boolean;
}

export { }
