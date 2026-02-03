import { useTelegram } from '@/contexts/TelegramContext';

interface HeaderProps {
  onAddClick: () => void;
}

export function Header({ onAddClick }: HeaderProps) {
  const { theme, user, toggleTheme, hapticFeedback } = useTelegram();
  
  const handleToggleTheme = () => {
    hapticFeedback('selection');
    toggleTheme();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return 'Доброй ночи';
    if (hour < 12) return 'Доброе утро';
    if (hour < 18) return 'Добрый день';
    return 'Добрый вечер';
  };

  return (
    <header 
      className="sticky top-0 z-10 px-4 pt-4 pb-3"
      style={{ backgroundColor: theme.bgColor }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p 
            className="text-sm font-medium"
            style={{ color: theme.hintColor }}
          >
            {getGreeting()},
          </p>
          <h1 
            className="text-2xl font-bold"
            style={{ color: theme.textColor }}
          >
            {user?.firstName || 'Пользователь'} 👋
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Theme Toggle Button */}
          <button
            onClick={handleToggleTheme}
            className="flex items-center justify-center w-10 h-10 rounded-full transition-all active:scale-95"
            style={{ 
              backgroundColor: theme.secondaryBgColor,
            }}
            title={theme.isDark ? 'Светлая тема' : 'Тёмная тема'}
          >
            {theme.isDark ? (
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke={theme.textColor} 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" 
                />
              </svg>
            ) : (
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke={theme.textColor} 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" 
                />
              </svg>
            )}
          </button>
          
          {/* Add Task Button */}
          <button
            onClick={onAddClick}
            className="flex items-center justify-center w-12 h-12 rounded-full transition-transform active:scale-95"
            style={{ 
              backgroundColor: theme.buttonColor,
              boxShadow: theme.isDark 
                ? '0 4px 12px rgba(0, 0, 0, 0.4)' 
                : '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
          >
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke={theme.buttonTextColor} 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2.5} 
                d="M12 4v16m8-8H4" 
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Bot Info Banner */}
      <div 
        className="mt-4 p-3 rounded-xl flex items-center gap-2 sm:gap-3"
        style={{ backgroundColor: theme.secondaryBgColor }}
      >
        <div 
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: theme.buttonColor + '20' }}
        >
          <svg 
            className="w-4 h-4 sm:w-5 sm:h-5" 
            fill="none" 
            stroke={theme.buttonColor} 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" 
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0 overflow-hidden">
          <p 
            className="text-xs sm:text-sm font-medium leading-snug"
            style={{ color: theme.textColor }}
          >
            Отправьте боту голосовое или текст
          </p>
          <p 
            className="text-xs truncate mt-0.5"
            style={{ color: theme.hintColor }}
          >
            «Напомни в 18:00 забрать посылку»
          </p>
        </div>
      </div>
    </header>
  );
}
