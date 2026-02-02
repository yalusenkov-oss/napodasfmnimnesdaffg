import asyncio
import os
from pathlib import Path
from typing import Optional
import whisper
from bot.config import config


class SpeechService:
    """Сервис распознавания речи"""
    
    _model = None
    
    @classmethod
    def get_model(cls):
        """Получить или загрузить модель Whisper"""
        if cls._model is None:
            print(f"🔄 Загружаю модель Whisper ({config.WHISPER_MODEL})...")
            cls._model = whisper.load_model(config.WHISPER_MODEL)
            print("✅ Модель загружена!")
        return cls._model
    
    @classmethod
    async def transcribe(cls, audio_path: str) -> Optional[str]:
        """
        Преобразовать аудио в текст
        
        Args:
            audio_path: Путь к аудио файлу
            
        Returns:
            Распознанный текст или None
        """
        try:
            model = cls.get_model()
            
            # Whisper синхронный, запускаем в отдельном потоке
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None,
                lambda: model.transcribe(audio_path, language="ru")
            )
            
            text = result.get("text", "").strip()
            return text if text else None
            
        except Exception as e:
            print(f"❌ Ошибка распознавания речи: {e}")
            return None
        
        finally:
            # Удаляем временный файл
            if os.path.exists(audio_path):
                os.remove(audio_path)
    
    @classmethod
    def get_temp_path(cls, file_id: str) -> str:
        """Получить путь для временного файла"""
        return str(config.TEMP_DIR / f"voice_{file_id}.ogg")
