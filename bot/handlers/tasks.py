from aiogram import Router
from aiogram.filters import Command
from aiogram.types import Message
from database import TaskRepository
from bot.keyboards import Keyboards
from bot.services import TaskParser

router = Router()


@router.message(Command("tasks"))
async def cmd_tasks(message: Message):
    """Показать все задачи"""
    
    user_id = message.from_user.id
    tasks = await TaskRepository.get_active(user_id)
    
    if not tasks:
        await message.answer(
            "📭 У тебя пока нет активных задач.\n\n"
            "Отправь голосовое или текстовое сообщение, чтобы создать задачу!",
            reply_markup=Keyboards.main_menu()
        )
        return
    
    # Формируем список
    text = "📋 **Твои активные задачи:**\n\n"
    
    category_emoji = {
        'reminder': '🔔',
        'task': '✅',
        'event': '📅'
    }
    
    for i, task in enumerate(tasks, 1):
        emoji = category_emoji.get(task.category, '🔔')
        date_str = TaskParser.format_datetime(task.remind_at) if task.remind_at else "без даты"
        
        text += f"{i}. {emoji} {task.text}\n"
        text += f"   ⏰ _{date_str}_\n\n"
    
    text += f"_Всего: {len(tasks)} задач(и)_"
    
    await message.answer(
        text,
        parse_mode="Markdown",
        reply_markup=Keyboards.main_menu()
    )


@router.message(Command("today"))
async def cmd_today(message: Message):
    """Показать задачи на сегодня"""
    
    user_id = message.from_user.id
    tasks = await TaskRepository.get_today(user_id)
    
    if not tasks:
        await message.answer(
            "🎉 На сегодня задач нет!\n\n"
            "Можешь расслабиться или добавить новую задачу.",
            reply_markup=Keyboards.main_menu()
        )
        return
    
    # Формируем список
    text = "📅 **Задачи на сегодня:**\n\n"
    
    category_emoji = {
        'reminder': '🔔',
        'task': '✅',
        'event': '📅'
    }
    
    for i, task in enumerate(tasks, 1):
        emoji = category_emoji.get(task.category, '🔔')
        time_str = task.remind_at.strftime('%H:%M') if task.remind_at else ""
        status = "✓" if task.completed else "○"
        
        text += f"{status} {emoji} {task.text}"
        if time_str:
            text += f" — _{time_str}_"
        text += "\n"
    
    await message.answer(
        text,
        parse_mode="Markdown",
        reply_markup=Keyboards.main_menu()
    )
