# USE Messenger - Быстрая шпаргалка

## Основные команды

```bash
# Запуск
start.bat          # Запустить все серверы

# Остановка
stop.bat           # Остановить все серверы

# Статус
status.bat         # Проверить статус серверов
```

## Первый запуск

```bash
1. install.bat     # Установить зависимости
2. start.bat       # Запустить серверы
3. Открыть http://localhost:3000
```

## Разработка

```bash
# Backend отдельно
cd backend
go run main.go

# Frontend отдельно
cd clients/web
npm run dev
```

## Сборка

```bash
build.bat          # Собрать production версию
```

## Очистка

```bash
clean.bat          # Удалить все временные файлы
```

## Логи

```bash
logs.bat backend   # Логи backend
logs.bat frontend  # Логи frontend
logs.bat all       # Все логи
```

## Адреса

- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- WebSocket: ws://localhost:4000/ws

## Возможности

✓ Регистрация/Вход
✓ Чаты в реальном времени
✓ Отправка изображений/видео/аудио
✓ Голосовые сообщения
✓ Аудио звонки (WebRTC)
✓ Аватары
✓ Плейлист
✓ Удаление сообщений

## Технологии

Backend: Go + SQLite + WebSocket
Frontend: React + Vite + Framer Motion

## Помощь

README.md - Полная документация
SCRIPTS.md - Документация по скриптам
STRUCTURE.md - Структура проекта
