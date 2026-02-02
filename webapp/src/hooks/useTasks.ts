import { useState, useEffect, useCallback } from 'react';
import { api } from '@/api';
import type { Task, TaskFilter } from '@/types/task';

interface UseTasksReturn {
  tasks: Task[];
  stats: {
    all: number;
    today: number;
    active: number;
    completed: number;
  };
  loading: boolean;
  error: string | null;
  filter: TaskFilter;
  setFilter: (filter: TaskFilter) => void;
  addTask: (data: Omit<Task, 'id' | 'createdAt' | 'completed' | 'updatedAt'>) => Promise<void>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  toggleTask: (id: number) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useTasks(): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState({ all: 0, today: 0, active: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TaskFilter>('all');

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await api.getTasks(filter === 'all' ? undefined : (filter as string));
      // resp.tasks уже адаптированы (camelCase) благодаря adaptTaskFromAPI
      setTasks(resp.tasks as Task[]);
      setStats(resp.counts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  const addTask = useCallback(async (data: Omit<Task, 'id' | 'createdAt' | 'completed' | 'updatedAt'>) => {
    try {
      const eventIso = new Date(`${data.dueDate.toDateString()} ${data.dueTime}`).toISOString();
      const payload: any = {
        text: data.title,
        category: data.category,
        event_at: eventIso,
        // reminder_offset_minutes: null means "Не указано" on backend
        reminder_offset_minutes: data.reminderMinutes ?? null,
      };
      const res = await api.createTask(payload);
      const newTask: Task = {
        id: res.id,
        title: data.title,
        description: data.description,
        category: data.category as Task['category'],
        dueDate: data.dueDate,
        dueTime: data.dueTime,
        reminderMinutes: data.reminderMinutes,
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setTasks((prev: Task[]) => [newTask, ...prev]);
      setStats((prev: typeof stats) => ({ ...prev, all: prev.all + 1, active: prev.active + 1 }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания');
      throw err;
    }
  }, []);

  const updateTask = useCallback(async (id: string, data: Partial<Task>) => {
    try {
      const numId = parseInt(id, 10);
      // Map frontend fields to API fields if present
      const payload: any = { ...data } as any;
      if ((data as any).dueDate || (data as any).dueTime) {
        const d = (data as any).dueDate || new Date();
        const t = (data as any).dueTime || '09:00';
        payload.event_at = new Date(`${d.toDateString()} ${t}`).toISOString();
        delete payload.dueDate;
        delete payload.dueTime;
      }
      if ('reminderMinutes' in (data as any)) {
        payload.reminder_offset_minutes = (data as any).reminderMinutes ?? null;
        delete payload.reminderMinutes;
      }

      await api.updateTask(numId, payload as any);
      setTasks((prev: Task[]) => prev.map((t: Task) => (t.id === numId ? { ...t, ...data, updatedAt: new Date() } : t)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка обновления');
      throw err;
    }
  }, []);

  const toggleTask = useCallback(async (id: number) => {
    try {
      // optimistic
      setTasks((prev: Task[]) => prev.map((t: Task) => (t.id === id ? { ...t, completed: !t.completed } : t)));
      await api.toggleTask(id);
      // refetch counts
      void fetchTasks();
    } catch (err) {
      void fetchTasks();
      throw err;
    }
  }, [fetchTasks]);

  const deleteTask = useCallback(async (id: number) => {
    try {
      setTasks((prev: Task[]) => prev.filter((t: Task) => t.id !== id));
      await api.deleteTask(id);
      void fetchTasks();
    } catch (err) {
      void fetchTasks();
      throw err;
    }
  }, [fetchTasks]);

  return {
    tasks,
    stats,
    loading,
    error,
    filter,
    setFilter,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    refetch: fetchTasks,
  };
}
