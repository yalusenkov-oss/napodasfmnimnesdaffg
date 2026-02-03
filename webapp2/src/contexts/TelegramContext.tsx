import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          enable: () => void;
          disable: () => void;
        };
        BackButton: {
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
          secondary_bg_color?: string;
        };
        colorScheme: 'light' | 'dark';
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
          };
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
        showAlert: (message: string, callback?: () => void) => void;
      };
    };
  }
}

export interface TelegramTheme {
  bgColor: string;
  textColor: string;
  hintColor: string;
  linkColor: string;
  buttonColor: string;
  buttonTextColor: string;
  secondaryBgColor: string;
  isDark: boolean;
}

interface TelegramContextType {
  theme: TelegramTheme;
  user: { firstName: string; lastName?: string } | null;
  isReady: boolean;
  isTelegram: boolean;
  hapticFeedback: (type: 'success' | 'error' | 'warning' | 'selection') => void;
  showConfirm: (message: string) => Promise<boolean>;
  toggleTheme: () => void;
}

const defaultTheme: TelegramTheme = {
  bgColor: '#ffffff',
  textColor: '#000000',
  hintColor: '#999999',
  linkColor: '#2481cc',
  buttonColor: '#2481cc',
  buttonTextColor: '#ffffff',
  secondaryBgColor: '#f1f1f1',
  isDark: false,
};

const darkTheme: TelegramTheme = {
  bgColor: '#1c1c1e',
  textColor: '#ffffff',
  hintColor: '#8e8e93',
  linkColor: '#0a84ff',
  buttonColor: '#0a84ff',
  buttonTextColor: '#ffffff',
  secondaryBgColor: '#2c2c2e',
  isDark: true,
};

const THEME_STORAGE_KEY = 'taskbot_theme';

const TelegramContext = createContext<TelegramContextType | null>(null);

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<TelegramTheme>(() => {
    // Восстанавливаем тему из localStorage при загрузке
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark') {
        if (typeof document !== 'undefined') {
          document.documentElement.style.backgroundColor = darkTheme.bgColor;
          document.body.style.backgroundColor = darkTheme.bgColor;
        }
        return darkTheme;
      }
      if (saved === 'light') {
        if (typeof document !== 'undefined') {
          document.documentElement.style.backgroundColor = defaultTheme.bgColor;
          document.body.style.backgroundColor = defaultTheme.bgColor;
        }
        return defaultTheme;
      }
    }
    // Fallback to default
    if (typeof document !== 'undefined') {
      document.documentElement.style.backgroundColor = defaultTheme.bgColor;
      document.body.style.backgroundColor = defaultTheme.bgColor;
    }
    return defaultTheme;
  });
  const [user, setUser] = useState<{ firstName: string; lastName?: string } | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isTelegram, setIsTelegram] = useState(false);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    if (tg) {
      setIsTelegram(true);
      tg.ready();
      tg.expand();

      const themeParams = tg.themeParams;
      const isDark = tg.colorScheme === 'dark';

      setTheme({
        bgColor: themeParams.bg_color || (isDark ? darkTheme.bgColor : defaultTheme.bgColor),
        textColor: themeParams.text_color || (isDark ? darkTheme.textColor : defaultTheme.textColor),
        hintColor: themeParams.hint_color || (isDark ? darkTheme.hintColor : defaultTheme.hintColor),
        linkColor: themeParams.link_color || (isDark ? darkTheme.linkColor : defaultTheme.linkColor),
        buttonColor: themeParams.button_color || (isDark ? darkTheme.buttonColor : defaultTheme.buttonColor),
        buttonTextColor: themeParams.button_text_color || (isDark ? darkTheme.buttonTextColor : defaultTheme.buttonTextColor),
        secondaryBgColor: themeParams.secondary_bg_color || (isDark ? darkTheme.secondaryBgColor : defaultTheme.secondaryBgColor),
        isDark,
      });
      // ensure document background matches Telegram theme
      if (typeof document !== 'undefined') {
        const bg = themeParams.bg_color || (isDark ? darkTheme.bgColor : defaultTheme.bgColor);
        document.documentElement.style.backgroundColor = bg;
        document.body.style.backgroundColor = bg;
      }

      const userData = tg.initDataUnsafe.user;
      if (userData) {
        setUser({
          firstName: userData.first_name,
          lastName: userData.last_name,
        });
      }
    } else {
      // Demo mode - проверяем сохранённую тему, иначе системную
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'dark') {
        setTheme(darkTheme);
      } else if (savedTheme === 'light') {
        setTheme(defaultTheme);
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark ? darkTheme : defaultTheme);
      }
      setUser({ firstName: 'Демо', lastName: 'Пользователь' });
    }

    setIsReady(true);
  }, []);

  const hapticFeedback = useCallback((type: 'success' | 'error' | 'warning' | 'selection') => {
    const tg = window.Telegram?.WebApp;
    if (tg?.HapticFeedback) {
      if (type === 'selection') {
        tg.HapticFeedback.selectionChanged();
      } else {
        tg.HapticFeedback.notificationOccurred(type);
      }
    }
  }, []);

  const showConfirm = useCallback((message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const tg = window.Telegram?.WebApp;
      if (tg?.showConfirm) {
        tg.showConfirm(message, (confirmed) => {
          resolve(confirmed);
        });
      } else {
        resolve(window.confirm(message));
      }
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const newTheme = prev.isDark ? defaultTheme : darkTheme;
      // Сохраняем выбор в localStorage
      try {
        localStorage.setItem(THEME_STORAGE_KEY, newTheme.isDark ? 'dark' : 'light');
      } catch {}
      // update document immediately so sticky header and page are in sync
      if (typeof document !== 'undefined') {
        document.documentElement.style.backgroundColor = newTheme.bgColor;
        document.body.style.backgroundColor = newTheme.bgColor;
      }
      return newTheme;
    });
  }, []);

  // Keep document background synced when theme changes from any source
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.backgroundColor = theme.bgColor;
      document.body.style.backgroundColor = theme.bgColor;
    }
  }, [theme.bgColor]);

  return (
    <TelegramContext.Provider value={{
      theme,
      user,
      isReady,
      isTelegram,
      hapticFeedback,
      showConfirm,
      toggleTheme,
    }}>
      {children}
    </TelegramContext.Provider>
  );
}

export function useTelegram() {
  const context = useContext(TelegramContext);
  if (!context) {
    throw new Error('useTelegram must be used within TelegramProvider');
  }
  return context;
}
