from aiogram import Router, F
from aiogram.filters import Command, CommandStart
from aiogram.types import Message, CallbackQuery
from bot.keyboards import Keyboards
from database import TaskRepository

router = Router()


@router.message(CommandStart())
async def cmd_start(message: Message):
    user_name = message.from_user.first_name or "друг"
    
    welcome_text = (
        f"👋 Привет, {user_name}!\n\n"
        "Я — TaskBot, твой умный помощник для управления задачами.\n\n"
        "🎤 Голосом: Отправь голосовое сообщение\n"
        "Например: «Напомни завтра в 15:00 позвонить маме»\n\n"
        "✍️ Текстом: Просто напиши задачу\n"
        "Например: «Напомни через 2 часа проверить почту»\n\n"
        "📱 Приложение: Нажми кнопку ниже\n\n"
        "📌 Команды:\n"
        "/tasks — список задач\n"
        "/today — задачи на сегодня\n"
        "/help — помощь"
    )
    
    await message.answer(
        welcome_text,
        reply_markup=Keyboards.main_menu()
    )


@router.message(Command("help"))
async def cmd_help(message: Message):
    help_text = (
        "📖 Как пользоваться TaskBot\n\n"
        "🎤 Голосовые сообщения\n"
        "Просто запиши голосовое:\n"
        "• «Напомни завтра в 9 утра на встречу»\n"
        "• «Напомни через час позвонить»\n"
        "• «Не забыть купить молоко в субботу»\n\n"
        "✍️ Текстовые сообщения\n"
        "Напиши так же, как сказал бы:\n"
        "• «Напомни в понедельник сдать отчёт»\n"
        "• «Напомни 25 декабря поздравить друзей»\n\n"
        "📱 Mini App\n"
        "Нажми кнопку «Открыть список задач»\n\n"
        "📌 Команды:\n"
        "/start — начало работы\n"
        "/tasks — все задачи\n"
        "/today — задачи на сегодня\n"
        "/help — эта справка"
    )
    
    await message.answer(
        help_text,
        reply_markup=Keyboards.main_menu()
    )


@router.callback_query(F.data.in_({"open_webapp", "show_tasks"}))
async def open_webapp_callback(callback: CallbackQuery):
    """Handle user request to open the task list — send the list into chat.

    We accept both old fallback `open_webapp` and new `show_tasks` callback
    values for backward compatibility.
    """
    # Acknowledge the callback (remove loading state on client)
    await callback.answer()

    user_id = callback.from_user.id
    tasks = await TaskRepository.get_active(user_id)

    if not tasks:
        await callback.message.answer(
            "📭 У тебя пока нет активных задач.\n\n"
            "Отправь голосовое или текстовое сообщение, чтобы создать задачу!",
            reply_markup=Keyboards.main_menu()
        )
        return

    # Формируем список задач в виде текста (похож на /tasks)
    text = "📋 **Твои активные задачи:**\n\n"

    category_emoji = {
        'reminder': '🔔',
        'task': '✅',
        'event': '📅'
    }

    from bot.services import TaskParser

    for i, task in enumerate(tasks, 1):
        emoji = category_emoji.get(task.category, '🔔')
        date_str = TaskParser.format_datetime(task.remind_at) if task.remind_at else "без даты"

        text += f"{i}. {emoji} {task.text}\n"
        text += f"   ⏰ _{date_str}_\n\n"

    text += f"_Всего: {len(tasks)} задач(и)_"

    await callback.message.answer(
        text,
        parse_mode="Markdown",
        reply_markup=Keyboards.main_menu()
    )
