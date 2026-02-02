"""Bot package.

Avoid importing `main` at package import time to prevent early imports of
third-party libraries (aiogram) before the environment is ready. Import
and run `bot.main` explicitly (e.g. `python -m bot.main`).
"""

__all__ = []
