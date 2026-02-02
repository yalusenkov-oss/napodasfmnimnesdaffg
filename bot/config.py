import os
from pathlib import Path
from dotenv import load_dotenv

# Определяем корень проекта и явно загружаем .env из него — это надёжнее,
# чем полагаться на автоматический поиск, особенно при запуске из разных
# рабочих директорий или через перезагрузчики.
BASE_DIR = Path(__file__).parent.parent
env_path = BASE_DIR / '.env'
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    # Попытка загрузить стандартным способом (fallback)
    load_dotenv()


class Config:
    """Конфигурация бота"""
    
    # Telegram
    BOT_TOKEN: str = os.getenv('BOT_TOKEN', '')
    
    # Mini App URL
    WEBAPP_URL: str = os.getenv('WEBAPP_URL', 'https://your-domain.com')
    
    # Whisper модель (tiny, base, small, medium, large)
    WHISPER_MODEL: str = os.getenv('WHISPER_MODEL', 'base')
    
    # Пути
    BASE_DIR: Path = BASE_DIR
    TEMP_DIR: Path = BASE_DIR / 'temp'
    
    @classmethod
    def validate(cls):
        """Проверить обязательные настройки"""
        if not cls.BOT_TOKEN:
            raise ValueError("BOT_TOKEN не установлен! Добавьте его в .env файл")
        
        # Создаём временную папку
        cls.TEMP_DIR.mkdir(parents=True, exist_ok=True)
        
        return True


config = Config()
