USE/
├── backend/                    # Go backend сервер
│   ├── auth/                  # JWT и bcrypt
│   ├── db/                    # SQLite база данных
│   ├── handlers/              # HTTP и WebSocket обработчики
│   ├── middleware/            # Middleware авторизации
│   ├── models/                # Модели данных
│   ├── uploads/               # Загруженные файлы (создается автоматически)
│   ├── go.mod                 # Go зависимости
│   ├── go.sum                 # Go checksums
│   ├── main.go                # Точка входа backend
│   └── use.db                 # SQLite база (создается автоматически)
│
├── clients/
│   └── web/                   # React frontend
│       ├── dist/              # Production сборка (создается при build)
│       ├── node_modules/      # npm зависимости (создается при install)
│       ├── src/
│       │   ├── App.jsx        # Главный компонент приложения
│       │   ├── index.css      # Глобальные стили
│       │   └── main.jsx       # Точка входа React
│       ├── index.html         # HTML шаблон
│       ├── package.json       # npm зависимости
│       ├── package-lock.json  # npm lock файл
│       └── vite.config.js     # Конфигурация Vite
│
├── .env.example               # Пример переменных окружения
├── .gitignore                 # Git ignore правила
├── config.json                # Конфигурация проекта
│
├── build.bat                  # Сборка production (Windows)
├── build.sh                   # Сборка production (Linux/Mac)
├── clean.bat                  # Очистка проекта (Windows)
├── clean.sh                   # Очистка проекта (Linux/Mac)
├── install.bat                # Установка зависимостей (Windows)
├── install.sh                 # Установка зависимостей (Linux/Mac)
├── logs.bat                   # Просмотр логов (Windows)
├── logs.sh                    # Просмотр логов (Linux/Mac)
├── start.bat                  # Запуск серверов (Windows)
├── start.sh                   # Запуск серверов (Linux/Mac)
├── status.bat                 # Проверка статуса (Windows)
├── status.sh                  # Проверка статуса (Linux/Mac)
├── stop.bat                   # Остановка серверов (Windows)
├── stop.sh                    # Остановка серверов (Linux/Mac)
│
├── README.md                  # Основная документация
└── SCRIPTS.md                 # Документация по скриптам
