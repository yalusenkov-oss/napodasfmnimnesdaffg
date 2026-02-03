export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: Date;
  dueTime: string;
  completed: boolean;
  createdAt: Date;
  category: 'reminder' | 'task' | 'event';
  reminderMinutes?: number; // За сколько минут до события напомнить
}

export type TaskFilter = 'all' | 'active' | 'completed' | 'today';
