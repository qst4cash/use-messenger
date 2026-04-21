# USE Messenger

Мессенджер в реальном времени с поддержкой аудио/видео звонков.

## Возможности

- Регистрация и авторизация
- Чаты в реальном времени (WebSocket)
- Отправка файлов (изображения, видео, аудио)
- Голосовые сообщения
- Аудио звонки (WebRTC)
- Аватары пользователей
- Плейлист для аудио файлов
- Удаление сообщений
- Анимации (Framer Motion)

## Быстрый старт

### Требования
- Go 1.21+
- Node.js 18+
- npm или yarn

### Первый запуск

#### Windows
```bash
install.bat    # Установить зависимости
start.bat      # Запустить серверы
```

#### Linux/Mac
```bash
chmod +x *.sh
./install.sh   # Установить зависимости
./start.sh     # Запустить серверы
```

Откройте http://localhost:3000 в браузере.

### Запуск

#### Windows
```bash
start.bat
```

#### Linux/Mac
```bash
./start.sh
```

### Остановка

#### Windows
```bash
stop.bat
```

#### Linux/Mac
```bash
./stop.sh
```

### Сборка production

#### Windows
```bash
build.bat
```

#### Linux/Mac
```bash
./build.sh
```

## Адреса

- Backend API: http://localhost:4000
- Frontend: http://localhost:3000
- WebSocket: ws://localhost:4000/ws

## Структура проекта

```
USE/
├── backend/           # Go backend
│   ├── auth/         # JWT и хеширование паролей
│   ├── db/           # SQLite база данных
│   ├── handlers/     # HTTP и WebSocket обработчики
│   ├── middleware/   # Middleware для авторизации
│   ├── models/       # Модели данных
│   ├── uploads/      # Загруженные файлы
│   └── main.go       # Точка входа
├── clients/
│   └── web/          # React frontend
│       ├── src/
│       │   ├── App.jsx      # Главный компонент
│       │   ├── index.css    # Стили
│       │   └── main.jsx     # Точка входа
│       └── package.json
├── start.bat/sh      # Скрипты запуска
├── stop.bat/sh       # Скрипты остановки
├── build.bat/sh      # Скрипты сборки
└── config.json       # Конфигурация
```

## API Endpoints

### Авторизация
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход

### Пользователи
- `GET /api/users` - Список пользователей
- `GET /api/users/{id}` - Информация о пользователе
- `POST /api/users/avatar` - Загрузка аватара

### Чаты
- `GET /api/chats` - Список чатов
- `POST /api/chats` - Создать чат
- `GET /api/chats/{id}` - Информация о чате
- `GET /api/chats/{id}/messages` - Сообщения чата

### Сообщения
- `DELETE /api/messages/{id}` - Удалить сообщение

### Файлы
- `POST /api/files/upload` - Загрузить файл
- `GET /uploads/{filename}` - Скачать файл

### WebSocket
- `GET /ws?token={jwt_token}` - WebSocket соединение

## WebSocket события

### Отправка
```json
{
  "type": "message",
  "chat_id": 1,
  "content": "Hello"
}
```

### Получение
```json
{
  "type": "message",
  "id": 1,
  "chat_id": 1,
  "user_id": 1,
  "username": "user",
  "content": "Hello",
  "created_at": "2026-04-21T10:00:00Z"
}
```

## Технологии

### Backend
- Go 1.21
- Gorilla Mux - HTTP роутер
- Gorilla WebSocket - WebSocket
- SQLite - База данных
- JWT - Авторизация
- bcrypt - Хеширование паролей

### Frontend
- React 18
- Vite - Сборщик
- Framer Motion - Анимации
- WebRTC - Аудио звонки
- WebSocket - Реал-тайм сообщения

## Конфигурация

Отредактируйте `config.json` для изменения настроек:

```json
{
  "backend": {
    "port": 4000,
    "database": "use.db",
    "uploads_dir": "uploads",
    "jwt_secret": "your-secret-key",
    "max_file_size": 52428800
  },
  "frontend": {
    "port": 3000,
    "api_url": "http://localhost:4000/api",
    "ws_url": "ws://localhost:4000/ws"
  }
}
```

## Разработка

### Backend
```bash
cd backend
go run main.go
```

### Frontend
```bash
cd clients/web
npm install
npm run dev
```

## Лицензия

MIT
