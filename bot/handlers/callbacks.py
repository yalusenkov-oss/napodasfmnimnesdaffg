from aiogram import Router, F
from aiogram.types import CallbackQuery
from database import TaskRepository
from bot.keyboards import Keyboards
from bot.services import TaskParser
from bot.config import config

router = Router()


@router.callback_query(F.data == "my_tasks")
async def callback_my_tasks(callback: CallbackQuery):
    user_id = callback.from_user.id
    
    try:
        tasks = await TaskRepository.get_active(user_id)
        counts = await TaskRepository.get_counts(user_id)
    except Exception as e:
        await callback.answer(f"Ошибка: {e}", show_alert=True)
        return
    
    if not tasks:
        await callback.message.edit_text(
            "📭 У тебя пока нет активных задач.\n\n"
            "Отправь голосовое или текстовое сообщение, чтобы создать задачу!",
            reply_markup=Keyboards.main_menu()
        )
        await callback.answer()
        return
    
    text = f"📋 Твои задачи ({counts['active']} активных)\n\n"
    
    category_emoji = {
        'reminder': '🔔',
        'task': '✅',
        'event': '📅'
    }
    
    for i, task in enumerate(tasks[:10], 1):
        emoji = category_emoji.get(task.category, '🔔')
        date_str = TaskParser.format_datetime(task.remind_at) if task.remind_at else "без даты"

        # Make the list consistent with /tasks: numbered, emoji, and time on the next line
        text += f"{i}. {emoji} {task.text}\n"
        text += f"   ⏰ _{date_str}_\n"
    
    if len(tasks) > 10:
        text += f"\n...и ещё {len(tasks) - 10} задач"
    
    try:
        await callback.message.edit_text(
            text,
            reply_markup=Keyboards.main_menu()
        )
    except Exception:
        await callback.message.answer(
            text,
            reply_markup=Keyboards.main_menu()
        )
    
    await callback.answer()


@router.callback_query(F.data.startswith("complete_"))
async def callback_complete(callback: CallbackQuery):
    task_id = int(callback.data.split("_")[1])
    user_id = callback.from_user.id
    
    success = await TaskRepository.toggle_completed(task_id, user_id)
    
    if success:
        await callback.answer("✅ Задача выполнена!", show_alert=False)
        await callback.message.edit_text(
            "✅ Задача отмечена выполненной!\n\nТак держать! 💪",
            reply_markup=Keyboards.back_to_list()
        )
    else:
        await callback.answer("❌ Задача не найдена", show_alert=True)


@router.callback_query(F.data.startswith("delete_"))
async def callback_delete(callback: CallbackQuery):
    task_id = int(callback.data.split("_")[1])
    
    await callback.message.edit_text(
        "🗑 Удалить задачу?\n\nЭто действие нельзя отменить.",
        reply_markup=Keyboards.confirm_delete(task_id)
    )
    await callback.answer()


@router.callback_query(F.data.startswith("confirm_delete_"))
async def callback_confirm_delete(callback: CallbackQuery):
    task_id = int(callback.data.split("_")[2])
    user_id = callback.from_user.id
    
    success = await TaskRepository.delete(task_id, user_id)
    
    if success:
        await callback.answer("🗑 Задача удалена", show_alert=False)
        await callback.message.edit_text(
            "🗑 Задача удалена",
            reply_markup=Keyboards.back_to_list()
        )
    else:
        await callback.answer("❌ Задача не найдена", show_alert=True)


@router.callback_query(F.data == "cancel_delete")
async def callback_cancel_delete(callback: CallbackQuery):
    await callback.message.edit_text(
        "👌 Удаление отменено",
        reply_markup=Keyboards.back_to_list()
    )
    await callback.answer()


@router.callback_query(F.data.startswith("edit_"))
async def callback_edit(callback: CallbackQuery):
    await callback.answer(
        "✏️ Для редактирования откройте приложение",
        show_alert=True
    )


@router.callback_query(F.data == "no_app")
async def callback_no_app(callback: CallbackQuery):
    """Notify user when Mini App is not configured locally.

    If a URL exists but wasn't suitable for WebApp, we provide it as a link.
    Otherwise show an alert that the Mini App isn't configured.
    """
    url = (config.WEBAPP_URL or '').strip()
    if url:
        # send link to the chat (opens in browser)
        try:
            await callback.message.answer(f"🔗 Mini App: {url}", reply_markup=Keyboards.main_menu())
        except Exception:
            await callback.answer("🔗 Mini App: {url}", show_alert=True)
    else:
        await callback.answer("Mini App не настроено на сервере", show_alert=True)


@router.callback_query(F.data == "open_app")
async def callback_open_app(callback: CallbackQuery):
    """Handle callback for opening the Mini App link.

    This is used when the URL is not https:// (e.g., localhost HTTP) so Telegram
    rejects it in a URL button. Instead we provide it as a message link.
    """
    url = (config.WEBAPP_URL or '').strip()
    if url:
        try:
            await callback.message.answer(
                f"🔗 Откройте приложение по ссылке:\n{url}",
                reply_markup=Keyboards.main_menu()
            )
        except Exception:
            await callback.answer(f"🔗 {url}", show_alert=False)
    else:
        await callback.answer("Mini App не настроено", show_alert=True)
    await callback.answer()
