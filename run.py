#!/usr/bin/env python3
"""
Скрипт запуска TaskBot
"""

import sys
import asyncio


def run_bot():
    """Запустить только бота"""
    from bot.main import main
    asyncio.run(main())


def run_api():
    """Запустить только API"""
    import uvicorn
    uvicorn.run(
        "api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )


def run_all():
    """Запустить бота и API вместе"""
    import subprocess
    import signal
    
    processes = []
    
    try:
        # Запускаем API
        api_process = subprocess.Popen([sys.executable, "-c", 
            "import uvicorn; uvicorn.run('api.main:app', host='0.0.0.0', port=8000)"
        ])
        processes.append(api_process)
        
        # Запускаем бота
        bot_process = subprocess.Popen([sys.executable, "-c",
            "import asyncio; from bot.main import main; asyncio.run(main())"
        ])
        processes.append(bot_process)
        
        print("🚀 TaskBot запущен!")
        print("🤖 Бот: работает")
        print("🌐 API: http://localhost:8000")
        
        # Ждём завершения
        for p in processes:
            p.wait()
            
    except KeyboardInterrupt:
        print("\n⏹ Останавливаю...")
        for p in processes:
            p.terminate()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Использование:")
        print("  python run.py bot   — запустить бота")
        print("  python run.py api   — запустить API")
        print("  python run.py all   — запустить всё")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "bot":
        run_bot()
    elif command == "api":
        run_api()
    elif command == "all":
        run_all()
    else:
        print(f"Неизвестная команда: {command}")
        sys.exit(1)
