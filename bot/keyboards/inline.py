from aiogram.types import (
    InlineKeyboardMarkup,
    InlineKeyboardButton,
    WebAppInfo,
)
from bot.config import config


def _web_button(text: str) -> InlineKeyboardButton:
    """Create a callback button that shows task list in chat.

    Previously this returned a WebApp button which opened the mini-app in the
    Telegram client. We now want the bot to send the list directly to chat, so
    the button uses callback_data `show_tasks` which the handler processes.
    """
    return InlineKeyboardButton(text=text, callback_data="show_tasks")


def _app_button(text: str) -> InlineKeyboardButton:
    """Return an InlineKeyboardButton that opens the Mini App when possible.

    - If `config.WEBAPP_URL` starts with https:// -> use WebAppInfo so Telegram
      opens the Mini App inside the client.
    - If it's an http:// URL or any non-HTTPS URL -> Telegram rejects URL buttons
      for non-HTTPS, so we use callback_data `open_app` instead.
    - If no URL is configured -> return a callback button `no_app` which the
      bot can handle and notify the user.
    """
    url = (config.WEBAPP_URL or '').strip()
    if not url:
        return InlineKeyboardButton(text=text, callback_data="no_app")
    if url.lower().startswith("https://"):
        return InlineKeyboardButton(text=text, web_app=WebAppInfo(url=url))
    # Non-HTTPS URLs (like http://localhost:5173) are rejected by Telegram's
    # URL button validation. Use callback instead and let the handler send the link.
    return InlineKeyboardButton(text=text, callback_data="open_app")


class Keyboards:
    """Клавиатуры бота"""
    
    @staticmethod
    def main_menu() -> InlineKeyboardMarkup:
        """Главное меню с кнопкой Mini App"""
        def _web_button(text: str) -> InlineKeyboardButton:
            """Local helper which returns a callback button for showing tasks."""
            return InlineKeyboardButton(text=text, callback_data="show_tasks")

        return InlineKeyboardMarkup(inline_keyboard=[
            [_web_button("📋 Открыть список задач")],
            [_app_button("📱 Открыть приложение")],
        ])
    
    @staticmethod
    def task_actions(task_id: int) -> InlineKeyboardMarkup:
        """Действия с задачей"""
        return InlineKeyboardMarkup(inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="✅ Выполнено",
                    callback_data=f"complete_{task_id}"
                ),
                InlineKeyboardButton(
                    text="🗑 Удалить",
                    callback_data=f"delete_{task_id}"
                )
            ],
            [_web_button("📋 Открыть список задач")]
        ])
    
    @staticmethod
    def task_created(task_id: int) -> InlineKeyboardMarkup:
        """Кнопки после создания задачи"""
        return InlineKeyboardMarkup(inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="✏️ Изменить",
                    callback_data=f"edit_{task_id}"
                ),
                InlineKeyboardButton(
                    text="🗑 Удалить",
                    callback_data=f"delete_{task_id}"
                )
            ],
            [_web_button("📋 Открыть список задач")]
        ])
    
    @staticmethod
    def confirm_delete(task_id: int) -> InlineKeyboardMarkup:
        """Подтверждение удаления"""
        return InlineKeyboardMarkup(inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="✅ Да, удалить",
                    callback_data=f"confirm_delete_{task_id}"
                ),
                InlineKeyboardButton(
                    text="❌ Отмена",
                    callback_data="cancel_delete"
                )
            ]
        ])
    
    @staticmethod
    def back_to_list() -> InlineKeyboardMarkup:
        """Кнопка возврата к списку"""
        return InlineKeyboardMarkup(inline_keyboard=[
            [_web_button("📋 Открыть список задач")]
        ])
