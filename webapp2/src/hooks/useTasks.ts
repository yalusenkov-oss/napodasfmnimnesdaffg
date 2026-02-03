import { useState, useEffect, useCallback } from 'react';
import type { Task, TaskFilter } from '@/types/task';

const STORAGE_KEY = 'taskbot_tasks';

// Demo tasks for initial state
const demoTasks: Task[] = [
  {
    id: '1',
    title: 'Забрать посылку с почты',
    dueDate: new Date(),
    dueTime: '18:00',
    completed: false,
    createdAt: new Date(Date.now() - 3600000),
    category: 'reminder',
  },
  {
    id: '2',
    title: 'Приём к врачу',
    description: 'Поликлиника №5, кабинет 302',
    dueDate: new Date(Date.now() + 86400000),
    dueTime: '15:00',
    completed: false,
    createdAt: new Date(Date.now() - 7200000),
    category: 'event',
  },
  {
    id: '3',
    title: 'Купить продукты',
    description: 'Молоко, хлеб, яйца, сыр',
    dueDate: new Date(),
    dueTime: '19:30',
    completed: false,
    createdAt: new Date(Date.now() - 1800000),
    category: 'task',
  },
  {
    id: '4',
    title: 'Позвонить маме',
    dueDate: new Date(Date.now() - 86400000),
    dueTime: '20:00',
    completed: true,
    createdAt: new Date(Date.now() - 172800000),
    category: 'reminder',
  },
  {
    id: '5',
    title: 'Оплатить интернет',
    dueDate: new Date(Date.now() + 172800000),
    dueTime: '12:00',
    completed: false,
    createdAt: new Date(Date.now() - 3600000),
    category: 'task',
  },
];

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Load tasks from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const tasksWithDates = parsed.map((task: Task) => ({
          ...task,
          dueDate: new Date(task.dueDate),
          createdAt: new Date(task.createdAt),
        }));
        setTasks(tasksWithDates);
      } catch {
        setTasks(demoTasks);
      }
    } else {
      setTasks(demoTasks);
    }
    setIsLoading(false);
  }, []);

  // Save tasks to localStorage
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }
  }, [tasks, isLoading]);

  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt' | 'completed'>) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      createdAt: new Date(),
      completed: false,
    };
    setTasks((prev) => [newTask, ...prev]);
  }, []);

  const toggleTask = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, ...updates } : task
      )
    );
  }, []);

  const filteredTasks = tasks.filter((task) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(task.dueDate);
    taskDate.setHours(0, 0, 0, 0);

    switch (filter) {
      case 'active':
        return !task.completed;
      case 'completed':
        return task.completed;
      case 'today':
        return taskDate.getTime() === today.getTime();
      default:
        return true;
    }
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // Completed tasks go to the bottom
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    // Sort by due date
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const stats = {
    total: tasks.length,
    active: tasks.filter((t) => !t.completed).length,
    completed: tasks.filter((t) => t.completed).length,
    today: tasks.filter((t) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const taskDate = new Date(t.dueDate);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime();
    }).length,
  };

  return {
    tasks: sortedTasks,
    filter,
    setFilter,
    addTask,
    toggleTask,
    deleteTask,
    updateTask,
    isLoading,
    stats,
  };
}
