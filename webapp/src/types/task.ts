export interface Task {
  id: number;
  title: string;
  description?: string;
  category: 'reminder' | 'task' | 'event';
  dueDate: Date;
  dueTime: string; // HH:MM format
  reminderMinutes?: number | null; // how many minutes before to remind; null = "Не указано"
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskCounts {
  all: number;
  today: number;
  active: number;
  completed: number;
}

export type TaskFilter = 'all' | 'active' | 'completed' | 'today';
