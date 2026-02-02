from aiogram import Router, F
from aiogram.types import Message
from bot.services import SpeechService, TaskParser
from bot.keyboards import Keyboards
from database import TaskRepository

router = Router()


@router.message(F.voice)
async def handle_voice(message: Message):
    """Обработка голосовых сообщений"""
    
    # Отправляем статус
    processing_msg = await message.answer("🎤 Распознаю голосовое сообщение...")
    
    try:
        # Скачиваем файл
        file = await message.bot.get_file(message.voice.file_id)
        file_path = SpeechService.get_temp_path(message.voice.file_id)
        await message.bot.download_file(file.file_path, file_path)
        
        # Распознаём речь
        text = await SpeechService.transcribe(file_path)
        
        if not text:
            await processing_msg.edit_text(
                "😕 Не удалось распознать речь. Попробуй ещё раз или напиши текстом."
            )
            return
        
        # Показываем распознанный текст
        await processing_msg.edit_text(f"🎤 Распознано: _{text}_", parse_mode="Markdown")
        
        # Парсим задачу
        parsed = TaskParser.parse(text)
        
        # Проверяем, это запрос на напоминание?
        if TaskParser.is_reminder_request(text) or parsed.remind_at:
            await create_task_from_parsed(message, parsed)
        else:
            # Просто показываем распознанный текст
            await message.answer(
                f"💬 Я услышал: «{text}»\n\n"
                "Чтобы создать напоминание, скажи например:\n"
                "_«Напомни завтра в 15:00 позвонить маме»_",
                parse_mode="Markdown",
                reply_markup=Keyboards.main_menu()
            )
    
    except Exception as e:
        await processing_msg.edit_text(f"❌ Ошибка: {str(e)}")


async def create_task_from_parsed(message: Message, parsed: TaskParser):
    """Создать задачу из распознанного текста"""
    
    user_id = message.from_user.id
    
    # Проверяем дату
    if not parsed.remind_at:
        await message.answer(
            f"📝 Задача: _{parsed.text}_\n\n"
            "⚠️ Не удалось определить время. Укажи когда дополнительно напомнить:\n"
            "_«Напомни завтра в 15:00 ...»_",
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
