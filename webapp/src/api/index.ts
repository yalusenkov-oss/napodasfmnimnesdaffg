/**
 * API клиент для работы с бэкендом
 */
import type { Task as TaskInterface } from '@/types/task';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Получаем initData из Telegram WebApp
const getAuthHeader = (): string => {
    return (window as any).Telegram?.WebApp?.initData || '';
};

/**
 * Адаптер: конвертирует API ответ (snake_case) в фронтенд формат (camelCase)
 */
function adaptTaskFromAPI(apiTask: Task): TaskInterface {
    // prefer explicit event_at (time of the event). Fall back to remind_at for backward compatibility
    const timeSource = apiTask.event_at || apiTask.remind_at || '';
    const [, timePart] = (timeSource || '').split('T');
    return {
        id: apiTask.id,
        title: apiTask.text,
        description: undefined,
        category: apiTask.category,
        dueDate: timeSource ? new Date(timeSource) : new Date(),
        dueTime: timePart ? timePart.substring(0, 5) : '09:00',
        reminderMinutes: (apiTask as any).reminder_offset_minutes ?? null,
        completed: apiTask.completed,
        createdAt: new Date(apiTask.created_at),
        updatedAt: new Date(apiTask.updated_at),
    };
}

/**
 * Базовый запрос к API
 */
async function request<T>(
    method: string,
    endpoint: string,
    body?: unknown
): Promise<T> {
    const options: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': getAuthHeader(),
        },
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error((error as any).detail || `HTTP ${response.status}`);
    }

    return response.json();
}

/**
 * API методы
 */
export const api = {
    // Получить все задачи
    async getTasks(filter?: string) {
        const endpoint = filter ? `/api/tasks?filter=${filter}` : '/api/tasks';
        const response = await request<TaskListResponse>('GET', endpoint);
        return {
            tasks: response.tasks.map(adaptTaskFromAPI),
            counts: response.counts,
        };
    },

    // Получить счётчики
    getCounts: () => {
        return request<CountsResponse>('GET', '/api/tasks/counts');
    },

    // Создать задачу
    createTask: (data: CreateTaskData) => {
        return request<{ status: string; id: number }>('POST', '/api/tasks', data);
    },

    // Обновить задачу
    updateTask: (taskId: number, data: UpdateTaskData) => {
        return request<{ status: string }>('PUT', `/api/tasks/${taskId}`, data);
    },

    // Переключить статус
    toggleTask: (taskId: number) => {
        return request<{ status: string }>('POST', '/api/tasks/toggle', { task_id: taskId });
    },

    // Удалить задачу
    deleteTask: (taskId: number) => {
        return request<{ status: string }>('DELETE', `/api/tasks/${taskId}`);
    },
};

// Типы
export interface Task {
    id: number;
    text: string;
    category: 'reminder' | 'task' | 'event';
    event_at?: string | null;
    remind_at: string | null;
    reminder_offset_minutes?: number | null;
    completed: boolean;
    created_at: string;
    updated_at: string;
}

export interface TaskListResponse {
    tasks: Task[];
    counts: CountsResponse;
}

export interface CountsResponse {
    all: number;
    today: number;
    active: number;
    completed: number;
}

export interface CreateTaskData {
    text: string;
    category: string;
    event_at?: string;
    remind_at?: string;
    // optional frontend-only fields — backend will ignore unknown extras if not supported
    description?: string;
    repeats?: number;
    reminder_offset_minutes?: number;
}

export interface UpdateTaskData {
    text?: string;
    category?: string;
    event_at?: string;
    remind_at?: string;
    description?: string;
    repeats?: number;
    reminder_offset_minutes?: number;
    completed?: boolean;
}
