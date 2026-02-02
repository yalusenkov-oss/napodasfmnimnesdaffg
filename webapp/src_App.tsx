import { useState } from 'react';
import { useTelegram } from '@/hooks/useTelegram';
import { useTasks } from '@/hooks/useTasks';
import { Header } from '@/components/Header';
import { FilterTabs } from '@/components/FilterTabs';
import { TaskCard } from '@/components/TaskCard';
import { TaskForm } from '@/components/TaskForm';
import { EmptyState } from '@/components/EmptyState';
import type { Task } from '@/types/task';

export function App() {
  const { theme, isReady } = useTelegram();
  const { tasks, filter, setFilter, addTask, toggleTask, deleteTask, updateTask, stats } = useTasks();
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTask(null);
  };

  if (!isReady) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: theme.bgColor }}
      >
        <div className="flex flex-col items-center gap-4">
          <div 
            className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin"
            style={{ borderColor: theme.buttonColor, borderTopColor: 'transparent' }}
          />
          <p style={{ color: theme.hintColor }}>Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen pb-safe"
      style={{ backgroundColor: theme.bgColor }}
    >
      <Header onAddClick={() => setShowForm(true)} />
      
      <FilterTabs 
        filter={filter} 
        onFilterChange={setFilter} 
        stats={stats}
      />

      <main className="pt-2 pb-8">
        {tasks.length > 0 ? (
          <div>
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={toggleTask}
                onDelete={deleteTask}
                onEdit={handleEdit}
              />
            ))}
          </div>
        ) : (
          <EmptyState filter={filter} onAddClick={() => setShowForm(true)} />
        )}
      </main>

      {/* Quick Add Floating Button */}
      <div 
        className="fixed bottom-6 left-0 right-0 flex justify-center pointer-events-none px-2 sm:px-4"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div
          className="pointer-events-auto px-2.5 sm:px-4 py-2 sm:py-3 rounded-2xl shadow-2xl flex items-center gap-2 sm:gap-3 backdrop-blur-xl"
          style={{ 
            backgroundColor: theme.isDark ? 'rgba(44, 44, 46, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            maxWidth: 'calc(100vw - 16px)',
          }}
        >
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: theme.buttonColor + '20' }}
          >
            <svg 
              className="w-4 h-4" 
              fill="none" 
              stroke={theme.buttonColor} 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <p 
              className="text-xs sm:text-sm font-medium truncate"
              style={{ color: theme.textColor }}
            >
              Написать боту
            </p>
            <p 
              className="text-xs truncate"
              style={{ color: theme.hintColor }}
            >
              @notifymnebot
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-transform active:scale-95 flex-shrink-0 whitespace-nowrap"
            style={{ 
              backgroundColor: theme.buttonColor,
              color: theme.buttonTextColor,
            }}
          >
            + Задача
          </button>
        </div>
      </div>

      {/* Task Form Modal */}
      {showForm && (
        <TaskForm
          task={editingTask || undefined}
          onSubmit={addTask}
          onUpdate={updateTask}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
}
