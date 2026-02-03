import { useTelegram } from '@/contexts/TelegramContext';
import type { TaskFilter } from '@/types/task';

interface EmptyStateProps {
  filter: TaskFilter;
  onAddClick: () => void;
}

export function EmptyState({ filter, onAddClick }: EmptyStateProps) {
  const { theme } = useTelegram();

  const getContent = () => {
    switch (filter) {
      case 'completed':
        return {
          emoji: '✨',
          title: 'Нет выполненных задач',
          description: 'Начните отмечать задачи как выполненные',
        };
      case 'today':
        return {
          emoji: '📅',
          title: 'На сегодня пусто',
          description: 'У вас нет задач на сегодня. Добавьте новую!',
        };
      case 'active':
        return {
          emoji: '🎉',
          title: 'Все задачи выполнены!',
          description: 'Отличная работа! Можете отдохнуть или добавить новые задачи.',
        };
      default:
        return {
          emoji: '📝',
          title: 'Пока нет задач',
          description: 'Добавьте первую задачу или отправьте боту голосовое сообщение',
        };
    }
  };

  const content = getContent();

  return (
    <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
      <div className="text-6xl mb-4">{content.emoji}</div>
      <h3 
        className="text-lg font-semibold mb-2"
        style={{ color: theme.textColor }}
      >
        {content.title}
      </h3>
      <p 
        className="text-sm mb-6"
        style={{ color: theme.hintColor }}
      >
        {content.description}
      </p>
      <button
        onClick={onAddClick}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-transform active:scale-95"
        style={{
          backgroundColor: theme.buttonColor,
          color: theme.buttonTextColor,
        }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Добавить задачу
      </button>
    </div>
  );
}
