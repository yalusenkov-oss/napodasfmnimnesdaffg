import asyncio
from datetime import datetime
from typing import TYPE_CHECKING
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from database import TaskRepository

if TYPE_CHECKING:
    from aiogram import Bot


class ReminderScheduler:
    """Планировщик напоминаний"""
    
    def __init__(self, bot: 'Bot'):
        self.bot = bot
        self.scheduler = AsyncIOScheduler()
    
    def start(self):
        """Запустить планировщик"""
        # Если планировщик уже запущен — ничего не делаем
        if getattr(self.scheduler, 'running', False):
            return

        # Проверяем напоминания каждые 30 секунд
        self.scheduler.add_job(
            self._check_reminders,
            trigger=IntervalTrigger(seconds=30),
            id='check_reminders',
            replace_existing=True
        )
        self.scheduler.start()
        print("⏰ Планировщик напоминаний запущен")
    
    def stop(self):
        """Остановить планировщик"""
        if getattr(self.scheduler, 'running', False):
            self.scheduler.shutdown()
            print("⏰ Планировщик остановлен")
    
    async def _check_reminders(self):
        """Проверить и отправить напоминания"""
        try:
            # Получаем задачи, которые нужно напомнить
            tasks = await TaskRepository.get_pending_reminders()
            
            for task in tasks:
                await self._send_reminder(task)
                
        except Exception as e:
            print(f"❌ Ошибка проверки напоминаний: {e}")
    
    async def _send_reminder(self, task):
        """Отправить напоминание пользователю"""
        try:
            category_emoji = {
                'reminder': '🔔',
                'task': '✅',
                'event': '📅'
            }
            emoji = category_emoji.get(task.category, '🔔')
            
            message = (
                f"{emoji} **Напоминание!**\n\n"
                f"{task.text}"
            )
            
            await self.bot.send_message(
                chat_id=task.user_id,
                text=message,
                parse_mode='Markdown'
            )
            
            # Отмечаем как отправленное
            await TaskRepository.mark_notified(task.id)
            
        except Exception as e:
            print(f"❌ Ошибка отправки напоминания {task.id}: {e}")
