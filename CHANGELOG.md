# Changelog - USE Messenger

## 2026-04-25

### Initial Analysis
- Изучена структура проекта мессенджера
- Backend: Go + Gorilla Mux + SQLite + WebSocket
- Frontend: React + TypeScript + Vite + Tailwind CSS
- Основные функции: чаты, сообщения, файлы, голосовые сообщения, real-time обновления

### Started Services
- Backend запущен на порту 4000
- Frontend dev server запущен

---

## Архитектура проекта

### Backend структура:
- `main.go` - точка входа, роутинг, CORS
- `db/database.go` - SQLite, модели данных
- `handlers/` - обработчики HTTP/WebSocket
  - `auth.go` - регистрация, логин, профили
  - `chats.go` - создание и получение чатов
  - `messages.go` - сообщения, удаление
  - `websocket.go` - real-time коммуникация
  - `files.go` - загрузка файлов
- `auth/` - JWT токены, хеширование паролей
- `middleware/` - аутентификация middleware
- `models/` - модели данных

### Frontend структура:
- `src/App.tsx` - главный компонент, WebSocket логика
- `src/components/messenger/`
  - `ContactsSidebar.tsx` - список чатов, профиль, поиск
  - `ChatPane.tsx` - окно чата, сообщения, ввод
  - `MusicPlayer.tsx` - плеер
- `src/pages/auth.tsx` - страница входа/регистрации

### База данных:
- `users` - пользователи (username, password_hash, avatar_url, nickname, bio)
- `chats` - чаты (user1_id, user2_id)
- `messages` - сообщения (chat_id, user_id, content, file_url, file_type, read)

---

## 2026-04-26 01:18

### Bug Fix: Prevent Self-Chat
**Проблема:** Можно было создать чат сам с собой, что приводило к путанице с отметками прочтения

**Исправление:**
- Добавлена валидация в `CreateChat` handler
- Теперь невозможно создать чат с самим собой
- Возвращается ошибка "Cannot create chat with yourself"

**Файлы изменены:**
- `backend/handlers/chats.go` (строки 45-73)

**Примечание:** Отметки прочтения (галочки) в списке чатов работают корректно - они показываются только для сообщений, которые ты отправил другим пользователям. Проблема была в том, что можно было создать чат сам с собой.

---

## Итоги исправлений

✅ **Исправлено:**
1. Время сообщений теперь корректно сохраняется и отображается из базы данных
2. Невозможно создать чат сам с собой
3. Отметки прочтения работают корректно

**Статус серверов:**
- Backend: `http://localhost:4000` ✅
- Frontend: `http://localhost:3000` ✅

---

## Следующие шаги
- Ожидание инструкций для доработки функционала
