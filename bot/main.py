import asyncio
from aiogram import Bot, Dispatcher
from aiogram.enums import ParseMode

from bot.config import config
from bot.handlers import setup_routers
from bot.services import ReminderScheduler
from database import init_db


async def main():
    """Главная функция запуска бота"""
    
    # Проверяем конфигурацию
    config.validate()
    
    # Инициализируем базу данных
    await init_db()
    # Инициализируем асинхронное подключение (один общий объект)
    from database.connection import init_db_connection
    await init_db_connection()
    
    # Создаём бота
    # Используем явный параметр parse_mode — совместимо с aiogram 3.x
    bot = Bot(token=config.BOT_TOKEN, parse_mode=ParseMode.MARKDOWN)
    
    # Создаём диспетчер
    dp = Dispatcher()
    
    # Подключаем роутеры
    dp.include_router(setup_routers())
    
    # Запускаем планировщик напоминаний
    scheduler = ReminderScheduler(bot)
    scheduler.start()
    
    print("🤖 Бот запущен!")
    print(f"📱 Mini App URL: {config.WEBAPP_URL}")
    
    try:
        # Запускаем polling
        await dp.start_polling(bot)
    finally:
        scheduler.stop()
        # Закрываем DB connection и сессию бота
        try:
            from database.connection import close_db_connection
            await close_db_connection()
        except Exception:
            pass
        await bot.session.close()


if __name__ == "__main__":
    asyncio.run(main())
