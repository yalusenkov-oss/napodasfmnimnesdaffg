import { useTelegram } from '@/hooks/useTelegram';
import type { TaskFilter } from '@/types/task';

interface FilterTabsProps {
  filter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
  stats: {
    total: number;
    active: number;
    completed: number;
    today: number;
  };
}

const filters: { key: TaskFilter; label: string; statKey: keyof FilterTabsProps['stats'] }[] = [
  { key: 'all', label: 'Все', statKey: 'total' },
  { key: 'today', label: 'Сегодня', statKey: 'today' },
  { key: 'active', label: 'Активные', statKey: 'active' },
  { key: 'completed', label: 'Готово', statKey: 'completed' },
];

export function FilterTabs({ filter, onFilterChange, stats }: FilterTabsProps) {
  const { theme, hapticFeedback } = useTelegram();

  const handleClick = (key: TaskFilter) => {
    hapticFeedback('selection');
    onFilterChange(key);
  };

  return (
    <div className="px-4 py-2">
      <div 
        className="flex gap-2 p-1 rounded-xl overflow-x-auto no-scrollbar"
        style={{ backgroundColor: theme.secondaryBgColor }}
      >
        {filters.map(({ key, label, statKey }) => {
          const isActive = filter === key;
          const count = stats[statKey];

          return (
            <button
              key={key}
              onClick={() => handleClick(key)}
              className="flex-1 min-w-fit px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
              style={{
                backgroundColor: isActive ? theme.buttonColor : 'transparent',
                color: isActive ? theme.buttonTextColor : theme.hintColor,
              }}
            >
              {label}
              <span 
                className="ml-1.5 text-xs opacity-70"
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
