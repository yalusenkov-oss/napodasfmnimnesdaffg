from aiogram import Router
from bot.handlers.start import router as start_router
from bot.handlers.tasks import router as tasks_router
from bot.handlers.voice import router as voice_router
from bot.handlers.text import router as text_router
from bot.handlers.callbacks import router as callbacks_router


def setup_routers() -> Router:
    """Собрать все роутеры в один"""
    main_router = Router()
    
    # Порядок важен! Сначала более специфичные
    main_router.include_router(start_router)
    main_router.include_router(callbacks_router)
    main_router.include_router(voice_router)
    main_router.include_router(tasks_router)
    main_router.include_router(text_router)  # В конце — общий обработчик текста
    
    return main_router


__all__ = ['setup_routers']
