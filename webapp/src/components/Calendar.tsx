import { useState, useMemo } from 'react';
import { useTelegram } from '@/hooks/useTelegram';

interface CalendarProps {
  selectedDate: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
}

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

export function Calendar({ selectedDate, onSelect, onClose }: CalendarProps) {
  const { theme, hapticFeedback } = useTelegram();
  const [currentMonth, setCurrentMonth] = useState(() => {
    return new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  });

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // First day of month
    const firstDay = new Date(year, month, 1);
    // Last day of month
    const lastDay = new Date(year, month + 1, 0);
    
    // Day of week for first day (0 = Sunday, convert to Monday = 0)
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6;
    
    const days: (Date | null)[] = [];
    
    // Add empty cells for days before first day of month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }
    
    // Add empty cells to complete the last week
    while (days.length % 7 !== 0) {
      days.push(null);
    }
    
    return days;
  }, [currentMonth]);

  const goToPrevMonth = () => {
    hapticFeedback('selection');
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    hapticFeedback('selection');
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    hapticFeedback('selection');
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  const handleSelectDate = (date: Date) => {
    hapticFeedback('success');
    onSelect(date);
    onClose();
  };

  const isSelected = (date: Date) => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const isToday = (date: Date) => {
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isPast = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d < today;
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Calendar Container */}
      <div
        className="relative w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-slide-up"
        style={{ backgroundColor: theme.bgColor }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="px-5 py-4 flex items-center justify-between"
          style={{ backgroundColor: theme.buttonColor }}
        >
          <button
            onClick={goToPrevMonth}
            className="p-2 rounded-xl transition-transform active:scale-90"
            style={{ color: theme.buttonTextColor }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="text-center">
            <h3 
              className="text-lg font-bold"
              style={{ color: theme.buttonTextColor }}
            >
              {MONTHS[currentMonth.getMonth()]}
            </h3>
            <p 
              className="text-sm opacity-80"
              style={{ color: theme.buttonTextColor }}
            >
              {currentMonth.getFullYear()}
            </p>
          </div>

          <button
            onClick={goToNextMonth}
            className="p-2 rounded-xl transition-transform active:scale-90"
            style={{ color: theme.buttonTextColor }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 px-3 pt-4 pb-2">
          {WEEKDAYS.map((day) => (
            <div 
              key={day}
              className="text-center text-xs font-semibold py-2"
              style={{ color: theme.hintColor }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 px-3 pb-3">
          {calendarDays.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const selected = isSelected(date);
            const todayDate = isToday(date);
            const past = isPast(date);

            return (
              <button
                key={date.toISOString()}
                onClick={() => handleSelectDate(date)}
                className="aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-all active:scale-90"
                style={{
                  backgroundColor: selected 
                    ? theme.buttonColor 
                    : todayDate 
                      ? theme.buttonColor + '20'
                      : 'transparent',
                  color: selected 
                    ? theme.buttonTextColor 
                    : past 
                      ? theme.hintColor + '80'
                      : todayDate 
                        ? theme.buttonColor 
                        : theme.textColor,
                  fontWeight: todayDate || selected ? 600 : 500,
                }}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div 
          className="px-4 py-3 flex items-center justify-between border-t"
          style={{ borderColor: theme.secondaryBgColor }}
        >
          <button
            onClick={goToToday}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-transform active:scale-95"
            style={{ 
              backgroundColor: theme.secondaryBgColor,
              color: theme.textColor,
            }}
          >
            Сегодня
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-transform active:scale-95"
            style={{ 
              backgroundColor: theme.buttonColor,
              color: theme.buttonTextColor,
            }}
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
}
