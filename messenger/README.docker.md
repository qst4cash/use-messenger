# USE Messenger - Docker Setup

## Быстрый старт с Docker

### Запуск одной командой:

```bash
docker-compose up -d
```

### Остановка:

```bash
docker-compose down
```

### Пересборка и запуск:

```bash
docker-compose up -d --build
```

### Просмотр логов:

```bash
# Все сервисы
docker-compose logs -f

# Только backend
docker-compose logs -f backend

# Только frontend
docker-compose logs -f frontend
```

## Адреса

- Frontend: http://localhost:3000
- Backend: http://localhost:4000

## Структура проекта

```
messenger/
├── backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   └── ... (Go код)
├── frontend/
│   ├── Dockerfile
│   ├── .dockerignore
│   └── ... (React код)
├── docker-compose.yml
└── README.docker.md
```

## Команды Docker

```bash
# Остановить контейнеры
docker-compose stop

# Удалить контейнеры
docker-compose rm -f

# Просмотр запущенных контейнеров
docker-compose ps

# Перезапуск сервиса
docker-compose restart backend
docker-compose restart frontend
```

## Для продакшена на VPS

1. Загрузите папку messenger на сервер
2. Перейдите в папку: `cd /root/messenger`
3. Запустите: `docker-compose up -d --build`

Используйте `--build` только при первом запуске или после изменения кода.
