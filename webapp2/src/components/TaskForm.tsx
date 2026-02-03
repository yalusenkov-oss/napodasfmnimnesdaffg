import { useState } from 'react';
import { useTelegram } from '@/contexts/TelegramContext';
import { Calendar } from '@/components/Calendar';
import type { Task } from '@/types/task';

interface TaskFormProps {
  task?: Task; // If provided, we're editing
  onSubmit: (task: Omit<Task, 'id' | 'createdAt' | 'completed'>) => void;
  onUpdate?: (id: string, updates: Partial<Task>) => void;
  onClose: () => void;
}

// Опции времени напоминания (в минутах)
const REMINDER_OPTIONS = [
  { value: 5, label: 'За 5 минут' },
  { value: 15, label: 'За 15 минут' },
  { value: 30, label: 'За 30 минут' },
  { value: 60, label: 'За 1 час' },
  { value: -1, label: 'Своё время', isCustom: true },
];

export function TaskForm({ task, onSubmit, onUpdate, onClose }: TaskFormProps) {
  const { theme, hapticFeedback } = useTelegram();
  const isEditing = !!task;
  
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [dueDate, setDueDate] = useState<Date>(() => {
    if (task?.dueDate) {
      return new Date(task.dueDate);
    }
    return new Date();
  });
  const [dueTime, setDueTime] = useState(task?.dueTime || '12:00');
  const [category, setCategory] = useState<Task['category']>(task?.category || 'reminder');
  const [showCalendar, setShowCalendar] = useState(false);
  const [reminderMinutes, setReminderMinutes] = useState(task?.reminderMinutes || 15);
  const [showReminderDropdown, setShowReminderDropdown] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');
  const [isCustomReminder, setIsCustomReminder] = useState(false);

  const getReminderLabel = (minutes: number) => {
    const option = REMINDER_OPTIONS.find(o => o.value === minutes);
    if (option) return option.label;
    if (minutes < 60) return `За ${minutes} мин`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `За ${hours} ч`;
    return `За ${hours} ч ${mins} мин`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      hapticFeedback('error');
      return;
    }

    hapticFeedback('success');
    
    if (isEditing && task && onUpdate) {
      onUpdate(task.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate,
        dueTime,
        category,
        reminderMinutes,
      });
    } else {
      onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate,
        dueTime,
        category,
        reminderMinutes,
      });
    }
    onClose();
  };

  const handleReminderSelect = (value: number) => {
    hapticFeedback('selection');
    if (value === -1) {
      setIsCustomReminder(true);
      setCustomMinutes('');
    } else {
      setIsCustomReminder(false);
      setReminderMinutes(value);
    }
    setShowReminderDropdown(false);
  };

  const formatDisplayDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    if (d.getTime() === today.getTime()) {
      return 'Сегодня';
    } else if (d.getTime() === tomorrow.getTime()) {
      return 'Завтра';
    } else {
      return d.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  const categories: { key: Task['category']; label: string; icon: React.ReactNode }[] = [
    {
      key: 'reminder',
      label: 'Напоминание',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
    },
    {
      key: 'task',
      label: 'Задача',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      key: 'event',
      label: 'Событие',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  // Quick date selection options
  const quickDates = [
    { label: 'Сегодня', date: new Date() },
    { label: 'Завтра', date: new Date(Date.now() + 86400000) },
    { label: 'Через неделю', date: new Date(Date.now() + 7 * 86400000) },
  ];

  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex items-end justify-center"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 backdrop-blur-sm" 
          style={{ 
            backgroundColor: theme.isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)' 
          }}
        />

        {/* Form Container */}
        <div
          className="relative w-full max-w-lg rounded-t-3xl pb-safe animate-slide-up max-h-[85vh] flex flex-col"
          style={{ 
            backgroundColor: theme.bgColor,
            boxShadow: theme.isDark 
              ? '0 -4px 32px rgba(0, 0, 0, 0.5)' 
              : '0 -4px 32px rgba(0, 0, 0, 0.15)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle + Header - Fixed at top */}
          <div 
            className="flex-shrink-0 rounded-t-3xl"
            style={{ backgroundColor: theme.bgColor }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div 
                className="w-10 h-1 rounded-full"
                style={{ backgroundColor: theme.hintColor + '40' }}
              />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-4">
              <button
                onClick={onClose}
                className="text-sm font-medium"
                style={{ color: theme.hintColor }}
              >
                Отмена
              </button>
              <h2 
                className="text-lg font-semibold"
                style={{ color: theme.textColor }}
              >
                {isEditing ? 'Редактировать' : 'Новая задача'}
              </h2>
              <button
                onClick={handleSubmit}
                className="text-sm font-semibold"
                style={{ color: theme.buttonColor }}
              >
                {isEditing ? 'Сохранить' : 'Готово'}
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-5 pb-6 space-y-5 overflow-y-auto flex-1">
            {/* Title Input */}
            <div>
              <input
                type="text"
                placeholder="Что нужно сделать?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                className="w-full px-4 py-3.5 rounded-xl text-base font-medium placeholder:font-normal transition-colors border-2 border-transparent focus:outline-none"
                style={{
                  backgroundColor: theme.secondaryBgColor,
                  color: theme.textColor,
                  caretColor: theme.buttonColor,
                }}
                onFocus={(e) => e.target.style.borderColor = theme.buttonColor}
                onBlur={(e) => e.target.style.borderColor = 'transparent'}
              />
            </div>

            {/* Description Input */}
            <div>
              <textarea
                placeholder="Описание (необязательно)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 rounded-xl text-sm resize-none transition-colors border-2 border-transparent focus:outline-none"
                style={{
                  backgroundColor: theme.secondaryBgColor,
                  color: theme.textColor,
                  caretColor: theme.buttonColor,
                }}
                onFocus={(e) => e.target.style.borderColor = theme.buttonColor}
                onBlur={(e) => e.target.style.borderColor = 'transparent'}
              />
            </div>

            {/* Date & Time Selection - Compact Row */}
            <div>
              <label 
                className="block text-xs font-medium mb-2 px-1"
                style={{ color: theme.hintColor }}
              >
                Время события
              </label>
              
              {/* Quick Date Buttons */}
              <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar">
                {quickDates.map(({ label, date }) => {
                  const d = new Date(date);
                  d.setHours(0, 0, 0, 0);
                  const selected = new Date(dueDate);
                  selected.setHours(0, 0, 0, 0);
                  const isActive = d.getTime() === selected.getTime();
                  
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        hapticFeedback('selection');
                        setDueDate(date);
                      }}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all active:scale-95"
                      style={{
                        backgroundColor: isActive ? theme.buttonColor : theme.secondaryBgColor,
                        color: isActive ? theme.buttonTextColor : theme.textColor,
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Date and Time in one row */}
              <div className="flex gap-2">
                {/* Date Picker Button - Compact */}
                <button
                  type="button"
                  onClick={() => {
                    hapticFeedback('selection');
                    setShowCalendar(true);
                  }}
                  className="flex-1 px-3 py-3 rounded-xl flex items-center gap-2 transition-all active:scale-[0.98]"
                  style={{ backgroundColor: theme.secondaryBgColor }}
                >
                  <svg 
                    className="w-5 h-5 flex-shrink-0" 
                    fill="none" 
                    stroke={theme.buttonColor} 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span 
                    className="text-sm font-medium truncate"
                    style={{ color: theme.textColor }}
                  >
                    {formatDisplayDate(dueDate)}
                  </span>
                </button>

                {/* Time Input - Compact */}
                <div 
                  className="px-3 py-3 rounded-xl flex items-center gap-2"
                  style={{ backgroundColor: theme.secondaryBgColor }}
                >
                  <svg 
                    className="w-5 h-5 flex-shrink-0" 
                    fill="none" 
                    stroke={theme.buttonColor} 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="bg-transparent text-sm font-medium outline-none w-[70px]"
                    style={{
                      color: theme.textColor,
                      colorScheme: theme.isDark ? 'dark' : 'light',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Reminder Time Selection */}
            <div>
              <label 
                className="block text-xs font-medium mb-2 px-1"
                style={{ color: theme.hintColor }}
              >
                Когда напомнить
              </label>
              
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    hapticFeedback('selection');
                    setShowReminderDropdown(!showReminderDropdown);
                  }}
                  className="w-full px-4 py-3 rounded-xl flex items-center justify-between transition-all active:scale-[0.99]"
                  style={{ backgroundColor: theme.secondaryBgColor }}
                >
                  <div className="flex items-center gap-3">
                    <svg 
                      className="w-5 h-5" 
                      fill="none" 
                      stroke={theme.buttonColor} 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span 
                      className="text-sm font-medium"
                      style={{ color: theme.textColor }}
                    >
                      {isCustomReminder 
                        ? (customMinutes ? `За ${customMinutes} мин` : 'Своё время')
                        : getReminderLabel(reminderMinutes)
                      }
                    </span>
                  </div>
                  <svg 
                    className={`w-5 h-5 transition-transform ${showReminderDropdown ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke={theme.hintColor} 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown */}
                {showReminderDropdown && (
                  <div 
                    className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden z-10"
                    style={{ 
                      backgroundColor: theme.secondaryBgColor,
                      boxShadow: theme.isDark 
                        ? '0 8px 24px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)' 
                        : '0 8px 24px rgba(0, 0, 0, 0.12)',
                    }}
                  >
                    {REMINDER_OPTIONS.map(({ value, label, isCustom }) => {
                      const isSelected = isCustom ? isCustomReminder : (!isCustomReminder && reminderMinutes === value);
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleReminderSelect(value)}
                          className="w-full px-4 py-3 text-left text-sm font-medium transition-colors flex items-center justify-between"
                          style={{ 
                            color: isSelected ? theme.buttonColor : theme.textColor,
                            backgroundColor: isSelected ? theme.buttonColor + '10' : 'transparent',
                          }}
                        >
                          <span className="flex items-center gap-2">
                            {isCustom && (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            )}
                            {label}
                          </span>
                          {isSelected && (
                            <svg 
                              className="w-5 h-5" 
                              fill="none" 
                              stroke={theme.buttonColor} 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Custom reminder input - appears below dropdown when selected */}
              {isCustomReminder && (
                <div 
                  className="mt-3 px-4 py-3 rounded-xl flex items-center gap-3 animate-slide-up"
                  style={{ backgroundColor: theme.secondaryBgColor }}
                >
                  <svg 
                    className="w-5 h-5 flex-shrink-0" 
                    fill="none" 
                    stroke={theme.buttonColor} 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <input
                    type="number"
                    placeholder="Введите количество"
                    value={customMinutes}
                    onChange={(e) => {
                      setCustomMinutes(e.target.value);
                      if (e.target.value) {
                        setReminderMinutes(parseInt(e.target.value, 10));
                      }
                    }}
                    autoFocus
                    min="1"
                    className="flex-1 bg-transparent text-sm font-medium outline-none"
                    style={{ color: theme.textColor }}
                  />
                  <span 
                    className="text-sm"
                    style={{ color: theme.hintColor }}
                  >
                    минут
                  </span>
                </div>
              )}
            </div>

            {/* Category */}
            <div>
              <label 
                className="block text-xs font-medium mb-2 px-1"
                style={{ color: theme.hintColor }}
              >
                Категория
              </label>
              <div className="grid grid-cols-3 gap-2">
                {categories.map(({ key, label, icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      hapticFeedback('selection');
                      setCategory(key);
                    }}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all"
                    style={{
                      backgroundColor: category === key 
                        ? theme.buttonColor + '20' 
                        : theme.secondaryBgColor,
                      color: category === key ? theme.buttonColor : theme.hintColor,
                      borderWidth: 2,
                      borderColor: category === key ? theme.buttonColor : 'transparent',
                    }}
                  >
                    {icon}
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-4 rounded-xl font-semibold text-base transition-transform active:scale-[0.98] shadow-lg"
              style={{
                backgroundColor: theme.buttonColor,
                color: theme.buttonTextColor,
              }}
            >
              {isEditing ? 'Сохранить изменения' : 'Создать задачу'}
            </button>
          </form>
        </div>
      </div>

      {/* Calendar Modal */}
      {showCalendar && (
        <Calendar
          selectedDate={dueDate}
          onSelect={(date) => setDueDate(date)}
          onClose={() => setShowCalendar(false)}
        />
      )}
    </>
  );
}
