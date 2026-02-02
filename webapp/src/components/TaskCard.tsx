import { useTelegram } from '@/hooks/useTelegram';
import type { Task } from '@/types/task';

interface TaskCardProps {
  task: Task;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (task: Task) => void;
}

export function TaskCard({ task, onToggle, onDelete, onEdit }: TaskCardProps) {
  const { theme, hapticFeedback, showConfirm } = useTelegram();

  /**
   * Форматирование даты
   */
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const taskDate = new Date(date);
    taskDate.setHours(0, 0, 0, 0);

    let dayStr: string;
    if (taskDate.getTime() === today.getTime()) {
      dayStr = 'Сегодня';
    } else if (taskDate.getTime() === tomorrow.getTime()) {
      dayStr = 'Завтра';
    } else if (taskDate.getTime() === yesterday.getTime()) {
      dayStr = 'Вчера';
    } else {
      dayStr = taskDate.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
      });
    }

    // Добавляем время
    const timeStr = date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return `${dayStr}, ${timeStr}`;
  };

  /**
   * Проверка просроченности
   */
  const isOverdue = (): boolean => {
    if (task.completed || !task.dueDate) return false;
    return new Date(task.dueDate) < new Date();
  };

  const handleToggle = () => {
    hapticFeedback(task.completed ? 'selection' : 'success');
    onToggle(task.id);
  };

  const handleEdit = () => {
    hapticFeedback('selection');
    onEdit(task);
  };

  const handleDelete = async () => {
    const confirmed = await showConfirm('Удалить задачу?');
    if (confirmed) {
      hapticFeedback('warning');
      onDelete(task.id);
    }
  };

  const getCategoryIcon = () => {
    switch (task.category) {
      case 'reminder':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        );
      case 'event':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
    }
  };

  const getCategoryLabel = () => {
    switch (task.category) {
      case 'reminder':
        return 'Напоминание';
      case 'event':
        return 'Событие';
      default:
        return 'Задача';
    }
  };

  const overdue = isOverdue();

  return (
    <div
      className="mx-4 mb-3 p-4 rounded-2xl transition-all duration-200 group"
      style={{
        backgroundColor: theme.secondaryBgColor,
        opacity: task.completed ? 0.6 : 1,
      }}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={handleToggle}
          className="flex-shrink-0 mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all"
          style={{
            borderColor: task.completed ? theme.buttonColor : theme.hintColor,
            backgroundColor: task.completed ? theme.buttonColor : 'transparent',
          }}
        >
          {task.completed && (
            <svg className="w-3.5 h-3.5" fill="none" stroke={theme.buttonTextColor} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0" onClick={handleEdit}>
          <h3
            className={`font-medium leading-snug ${task.completed ? 'line-through' : ''}`}
            style={{ color: task.completed ? theme.hintColor : theme.textColor }}
          >
            {task.title}
          </h3>

          <div className="mt-2 flex items-center gap-3 flex-wrap">
            {/* Category */}
            <span
              className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md"
              style={{ 
                backgroundColor: theme.buttonColor + '15',
                color: theme.buttonColor,
              }}
            >
              {getCategoryIcon()}
              <span className="hidden sm:inline">{getCategoryLabel()}</span>
            </span>

            {/* Date & Time */}
            {task.dueDate && (
              <span
                className="inline-flex items-center gap-1.5 text-xs font-medium"
                style={{ color: overdue ? '#ef4444' : theme.hintColor }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatDate(`${task.dueDate.toString().split('T')[0]}T${task.dueTime}`)}
                {overdue && ' • Просрочено'}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex items-center gap-1">
          <button
            onClick={handleEdit}
            className="p-2 rounded-lg transition-all active:scale-90"
            style={{ color: theme.buttonColor }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          <button
            onClick={handleDelete}
            className="p-2 rounded-lg transition-all active:scale-90"
            style={{ color: theme.hintColor }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}