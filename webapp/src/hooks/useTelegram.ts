import { useEffect, useState, useCallback } from 'react';

// Use shared Telegram typings from src/types/telegram.d.ts

interface TelegramTheme {
  bgColor: string;
  textColor: string;
  hintColor: string;
  linkColor: string;
  buttonColor: string;
  buttonTextColor: string;
  secondaryBgColor: string;
  isDark: boolean;
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

export function useTelegram() {
  const [theme, setTheme] = useState<TelegramTheme>(defaultTheme);
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

      const userData = tg.initDataUnsafe.user;
      if (userData) {
        setUser({
          firstName: userData.first_name,
          lastName: userData.last_name,
        });
      }
    } else {
      // Demo mode - check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? darkTheme : defaultTheme);
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

  return {
    theme,
    user,
    isReady,
    isTelegram,
    hapticFeedback,
    showConfirm,
  };
}
