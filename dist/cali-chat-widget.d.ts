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
    botName?: string;
    position?: 'bottom-right' | 'bottom-left';
    welcomeMessage?: string;
    avatarSrc?: string;
    useFavicon?: boolean;
}

export { }
