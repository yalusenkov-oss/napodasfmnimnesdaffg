import { useTelegram } from '@/hooks/useTelegram';

interface HeaderProps {
  onAddClick: () => void;
}

export function Header({ onAddClick }: HeaderProps) {
  const { theme, user } = useTelegram();

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
        
        <button
          onClick={onAddClick}
          className="flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-transform active:scale-95"
          style={{ backgroundColor: theme.buttonColor }}
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
