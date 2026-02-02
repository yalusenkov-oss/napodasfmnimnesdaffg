from aiogram import Router, F
from aiogram.types import Message
from bot.services import TaskParser
from bot.keyboards import Keyboards
from database import TaskRepository

router = Router()


@router.message(F.text)
async def handle_text(message: Message):
    """Обработка текстовых сообщений"""
    
    text = message.text.strip()
    
    # Игнорируем команды (начинаются с /)
    if text.startswith('/'):
        return
    
    # Парсим сообщение
    parsed = TaskParser.parse(text)
    
    # Проверяем, это запрос на напоминание?
    if not TaskParser.is_reminder_request(text) and not parsed.remind_at:
        # Не похоже на задачу, игнорируем или даём подсказку
        await message.answer(
            "💡 Чтобы создать напоминание, напиши например:\n\n"
            "• _Напомни завтра в 15:00 позвонить маме_\n"
            "• _Напомни через 2 часа проверить почту_\n"
            "• _Не забыть купить молоко в субботу_",
            parse_mode="Markdown",
            reply_markup=Keyboards.main_menu()
        )
        return
    
    user_id = message.from_user.id
    
    # Проверяем дату
    if not parsed.remind_at:
        await message.answer(
            f"📝 Задача: _{parsed.text}_\n\n"
            "⚠️ Не удалось определить время.\n"
            "Попробуй указать конкретнее:\n"
            "_«завтра в 15:00»_, _«через 2 часа»_, _«в понедельник»_",
            parse_mode="Markdown"
        )
        return
    
    # Сохраняем в базу
    task_id = await TaskRepository.create(
        user_id=user_id,
        text=parsed.text,
        category=parsed.category,
        event_at=parsed.event_at,
        reminder_offset_minutes=parsed.reminder_offset_minutes,
        remind_at=parsed.remind_at
    )
    
    # Формируем ответ
    category_labels = {
        'reminder': '🔔 Напоминание',
        'task': '✅ Задача',
        'event': '📅 Событие'
    }
    
    # Показываем время события (если есть) и дополнительное напоминание как текст
    date_str = TaskParser.format_datetime(parsed.event_at) if parsed.event_at else '—'
    if parsed.reminder_offset_minutes is None:
        extra = 'Не указано'
    else:
        mins = parsed.reminder_offset_minutes
        if mins < 60:
            extra = f'За {mins} минут'
        else:
            h = mins // 60
            extra = f'За {h} час(а)'
    
    response = f"""
✅ **Задача создана!**

{category_labels.get(parsed.category, '🔔 Напоминание')}
📝 {parsed.text}
📅 Событие: {date_str}
⏰ Доп. напоминание: {extra}
"""
    
    await message.answer(
        response,
        parse_mode="Markdown",
        reply_markup=Keyboards.task_created(task_id)
    )
