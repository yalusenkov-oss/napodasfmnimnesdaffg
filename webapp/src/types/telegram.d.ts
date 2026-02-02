interface TelegramWebApp {
    initData: string;
    initDataUnsafe: {
        user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
        };
    };
    colorScheme: 'light' | 'dark';
    themeParams: {
        bg_color?: string;
        secondary_bg_color?: string;
        text_color?: string;
        hint_color?: string;
        link_color?: string;
        button_color?: string;
        button_text_color?: string;
    };
    ready: () => void;
    expand: () => void;
    close: () => void;
    showAlert: (message: string, callback?: () => void) => void;
    showConfirm: (message: string, callback: (confirmed: boolean) => void) => void;
    HapticFeedback: {
        impactOccurred: (style: 'light' | 'medium' | 'heavy') => void;
        notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
        selectionChanged: () => void;
    };
}

interface Window {
    Telegram?: {
        WebApp: TelegramWebApp;
    };
}

// Optionally augment ImportMetaEnv for Vite
interface ImportMetaEnv {
    readonly VITE_API_URL?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
