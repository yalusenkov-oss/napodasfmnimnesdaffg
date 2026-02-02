import re
from datetime import datetime, timedelta
from typing import Optional, Tuple
from dataclasses import dataclass
import dateparser
from dateparser.search import search_dates


@dataclass
class ParsedTask:
    """Результат парсинга задачи"""
    text: str
    remind_at: Optional[datetime]
    category: str
    # original event datetime (if user specified an event time). May equal remind_at when no explicit event was provided.
    event_at: Optional[datetime] = None
    # optional explicit offset in minutes (if user said "за 15 минут" etc.)
    reminder_offset_minutes: Optional[int] = None


class TaskParser:
    """Парсер задач из естественного языка"""
    
    TRIGGER_WORDS = [
        'напомни', 'напомнить', 'напоминание', 'напомню',
        'remind', 'reminder',
        'не забыть', 'не забудь'
    ]
    TIME_PATTERNS = [
        r'завтра',
        r'сегодня',
        r'послезавтра',
        r'через\s+\d+\s*(час|мин|день|недел)',
        r'в\s+\d{1,2}[:\s]?\d{0,2}',
        r'в\s+\d{1,2}\s*(час|утра|вечера|дня|ночи)',
        r'на\s+\d{1,2}[:\s]?\d{0,2}',
        r'\d{1,2}[:\s]\d{2}',
        r'утром', r'днём', r'вечером', r'ночью',
        r'в\s+понедельник', r'во?\s+вторник', r'в\s+среду',
        r'в\s+четверг', r'в\s+пятницу', r'в\s+субботу', r'в\s+воскресенье',
        r'\d{1,2}\s*(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)',
    ]

    # Mapping for basic Russian number words -> digits
    _NUM_WORDS = {
        'ноль': 0, 'один': 1, 'одна': 1, 'два': 2, 'две': 2, 'три': 3, 'четыре': 4,
        'пять': 5, 'шесть': 6, 'семь': 7, 'восемь': 8, 'девять': 9, 'десять': 10,
        'одиннадцать': 11, 'двенадцать': 12, 'тринадцать': 13, 'четырнадцать': 14,
        'пятнадцать': 15, 'шестнадцать': 16, 'семнадцать': 17, 'восемнадцать': 18,
        'девятнадцать': 19, 'двадцать': 20, 'тридцать': 30, 'сорок': 40, 'пятьдесят': 50,
        'шестьдесят': 60
    }

    @classmethod
    def _normalize_number_words(cls, text: str) -> str:
        """Convert simple Russian number words ("девять", "двадцать три") to digits.

        This is a pragmatic approach: handles common constructions up to 69.
        """
        t = text
        # replace compound like 'двадцать три' -> '23'
        tens = {k: v for k, v in cls._NUM_WORDS.items() if v >= 20}
        ones = {k: v for k, v in cls._NUM_WORDS.items() if v < 20}

        # first replace combined forms (tens + ones)
        for tens_word, tens_val in tens.items():
            for ones_word, ones_val in ones.items():
                compound = f"{tens_word} {ones_word}"
                if compound in t:
                    t = re.sub(re.escape(compound), str(tens_val + ones_val), t, flags=re.IGNORECASE)

        # then replace remaining single words
        for word, val in cls._NUM_WORDS.items():
            t = re.sub(rf"\b{re.escape(word)}\b", str(val), t, flags=re.IGNORECASE)

        return t

    @classmethod
    def parse(cls, text: str) -> ParsedTask:
        original_text = text
        text_lower = text.lower().strip()
        # remove surrounding quotes/guillemets and fancy quotes which appear in forwarded messages
        text_lower = re.sub(r"[«»“”\"'`]", '', text_lower)

        category = cls._detect_category(text_lower)
        
        # remove trigger words
        clean_text = text_lower
        for trigger in cls.TRIGGER_WORDS:
            clean_text = clean_text.replace(trigger, '').strip()

        # Normalize number words ("девять" -> "9", "двадцать три" -> "23") to help parser
        clean_text = cls._normalize_number_words(clean_text)

        # extract explicit reminder offset like "за 15 минут" or composite "через 1 час 30 минут"
        offset_minutes = None
        # composite: "через X часов Y минут" or "через X час Y" etc.
        m_comp = re.search(r"\b(?:за|через)\s+(\d+)\s*(?:час|часа|часов)\b(?:\s*(\d+)\s*(?:минут|мин)\b)?", clean_text)
        if m_comp:
            hours = int(m_comp.group(1))
            mins = int(m_comp.group(2)) if m_comp.group(2) else 0
            offset_minutes = hours * 60 + mins
            clean_text = re.sub(m_comp.group(0), '', clean_text).strip()
        else:
            # minutes-only: "через 15 минут" or "за 15 минут" or just "через минуту" (= 1 minute)
            m = re.search(r"\b(?:за|через)\s+(?:(\d+)\s*)?(минут|минуту|мин)\b", clean_text)
            if m:
                # group 1 is the number (optional), group 2 is the unit word
                num_str = m.group(1)
                offset_minutes = int(num_str) if num_str else 1
                clean_text = re.sub(m.group(0), '', clean_text).strip()

        # First try: explicit constructs like 'завтра в 9 утра' or 'завтра 9:30'
        event_dt = None
        try:
            # detect date keyword
            date_offset = None
            if re.search(r'\bзавтра\b', clean_text):
                date_offset = 1
            elif re.search(r'\bсегодня\b', clean_text):
                date_offset = 0
            elif re.search(r'\bпослезавтра\b', clean_text):
                date_offset = 2

            # detect explicit time like 'в 9 утра' or 'в 09:30' or '9:30'
            time_match = re.search(r"(?:\bв\s+)?(\d{1,2})(?:[:\s]?(\d{2}))?\s*(утра|вечера|дня|ночи|час|часа)?\b", clean_text)
            if time_match:
                hour = int(time_match.group(1))
                minute = int(time_match.group(2)) if time_match.group(2) else 0
                mer = (time_match.group(3) or '').lower()
                # normalize meridiem hints
                if mer and ('вечер' in mer or 'ночи' in mer or 'дня' in mer):
                    if 1 <= hour <= 11:
                        hour = (hour % 12) + 12

                if date_offset is not None:
                    base = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
                    event_dt = base + timedelta(days=date_offset)
                    event_dt = event_dt.replace(hour=hour, minute=minute, second=0, microsecond=0)
                else:
                    # no explicit date word — choose nearest future datetime with this time
                    now = datetime.now()
                    candidate = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
                    if candidate <= now:
                        candidate = candidate + timedelta(days=1)
                    event_dt = candidate

                # remove matched parts to avoid duplication in title
                try:
                    clean_text = re.sub(re.escape(time_match.group(0)), '', clean_text, flags=re.IGNORECASE).strip()
                except Exception:
                    clean_text = clean_text.replace(time_match.group(0), '').strip()
        except Exception:
            event_dt = None
        if event_dt is None:
            try:
                settings = {
                    'PREFER_DATES_FROM': 'future',
                    'PREFER_DAY_OF_MONTH': 'first',
                    'RETURN_AS_TIMEZONE_AWARE': False,
                    'DATE_ORDER': 'DMY'
                }
                found = search_dates(clean_text, languages=['ru'], settings=settings)
                if found:
                    matched_text, dt = found[0]
                    # Если в найденном времени нет времени суток, подставим 09:00
                    if dt.hour == 0 and dt.minute == 0:
                        time_pattern = r'\d{1,2}[:\s]?\d{0,2}|\d{1,2}\s*(час|утра|вечера|дня)'
                        if not re.search(time_pattern, matched_text):
                            dt = dt.replace(hour=9, minute=0)
                    event_dt = dt
                    # Удалим найденную подстроку времени, чтобы она не попала в текст задачи
                    try:
                        clean_text = re.sub(re.escape(matched_text), '', clean_text, flags=re.IGNORECASE).strip()
                    except Exception:
                        clean_text = clean_text.replace(matched_text, '').strip()
            except Exception:
                event_dt = None

        # Если search_dates не нашёл ничего — пробуем прямой разбор всей строки
        if event_dt is None:
            event_dt = cls._parse_datetime(clean_text)

        # If we found an explicit offset but no event datetime, interpret offset as relative remind time
        if offset_minutes is not None and event_dt is None:
            remind_at = datetime.now() + timedelta(minutes=offset_minutes)
        elif offset_minutes is not None and event_dt is not None:
            # user specified both event time and offset -> remind before event
            remind_at = event_dt - timedelta(minutes=offset_minutes)
        else:
            # no explicit offset -> use parsed datetime (may be relative like "через 2 часа")
            remind_at = event_dt

        # Determine event_at: prefer explicit event_dt; if absent, set to remind_at so UI has a time to show
        event_at_val = event_dt if event_dt is not None else remind_at

        task_text = cls._extract_task_text(clean_text)
        
        if not task_text:
            task_text = original_text
        
        return ParsedTask(
            text=task_text.strip().capitalize(),
            remind_at=remind_at,
            event_at=event_at_val,
            category=category,
            reminder_offset_minutes=offset_minutes,
        )

    @classmethod
    def _detect_category(cls, text: str) -> str:
        event_words = ['встреча', 'собрание', 'событие', 'мероприятие', 'праздник', 'день рождения']
        task_words = ['сделать', 'купить', 'задача', 'выполнить', 'закончить']
        
        for word in event_words:
            if word in text:
                return 'event'
        
        for word in task_words:
            if word in text:
                return 'task'
        
        return 'reminder'

    @classmethod
    def _parse_datetime(cls, text: str) -> Optional[datetime]:
        # Исправленные настройки для dateparser
        settings = {
            'PREFER_DATES_FROM': 'future',
            'PREFER_DAY_OF_MONTH': 'first',
            'RETURN_AS_TIMEZONE_AWARE': False,
            'DATE_ORDER': 'DMY'
        }
        
        try:
            # Попробуем сначала найти даты/времена внутри строки (search_dates) — надежнее для фраз
            found = search_dates(text, languages=['ru'], settings=settings)
            if found:
                # search_dates возвращает список кортежей (matched_text, datetime)
                _, dt = found[0]
                # Если в найденном времени нет времени суток, подставим 09:00
                if dt.hour == 0 and dt.minute == 0:
                    time_pattern = r'\d{1,2}[:\s]?\d{2}|\d{1,2}\s*(час|утра|вечера|дня)'
                    if not re.search(time_pattern, text):
                        dt = dt.replace(hour=9, minute=0)
                return dt

            # Если search_dates не сработал — пробуем прямой разбор всей строки
            parsed = dateparser.parse(text, languages=['ru'], settings=settings)
            if parsed:
                # If parser returned a time equal/close to now, it's likely because
                # the user didn't specify time (dateparser uses current time). In
                # that case, and when the text doesn't contain an explicit time
                # token, set default hour to 09:00.
                time_pattern = r'\d{1,2}[:\s]?\d{2}|\d{1,2}\s*(час|утра|вечера|дня|ночи)'
                now = datetime.now()
                # treat as 'no explicit time' when parsed time equals current time (within 2 minutes)
                close_to_now = abs((parsed - now).total_seconds()) < 120
                if (parsed.hour == 0 and parsed.minute == 0) or (close_to_now and not re.search(time_pattern, text)):
                    if not re.search(time_pattern, text):
                        parsed = parsed.replace(hour=9, minute=0, second=0, microsecond=0)
                return parsed
        except Exception as e:
            print(f"Ошибка парсинга даты: {e}")
        
        return None

    @classmethod
    def _extract_task_text(cls, text: str) -> str:
        result = text
        
        for pattern in cls.TIME_PATTERNS:
            result = re.sub(pattern, '', result, flags=re.IGNORECASE)
        
        result = ' '.join(result.split())
        result = re.sub(r'^(на|в|к|о|об|про)\s+', '', result)
        
        return result.strip()

    @classmethod
    def is_reminder_request(cls, text: str) -> bool:
        text_lower = text.lower()
        return any(trigger in text_lower for trigger in cls.TRIGGER_WORDS)

    @classmethod
    def format_datetime(cls, dt: datetime) -> str:
        now = datetime.now()
        today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        tomorrow = today + timedelta(days=1)
        
        task_day = dt.replace(hour=0, minute=0, second=0, microsecond=0)
        time_str = dt.strftime('%H:%M')
        
        if task_day == today:
            return f"сегодня в {time_str}"
        elif task_day == tomorrow:
            return f"завтра в {time_str}"
        else:
            months = [
                'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
                'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
            ]
            return f"{dt.day} {months[dt.month - 1]} в {time_str}"
