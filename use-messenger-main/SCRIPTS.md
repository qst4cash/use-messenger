# USE Messenger - Скрипты управления

Все доступные скрипты для управления проектом USE.

## Основные команды

### start.bat / start.sh
Запускает backend и frontend серверы.

**Windows:**
```bash
start.bat
```

**Linux/Mac:**
```bash
./start.sh
```

### stop.bat / stop.sh
Останавливает все запущенные серверы.

**Windows:**
```bash
stop.bat
```

**Linux/Mac:**
```bash
./stop.sh
```

### status.bat / status.sh
Проверяет статус серверов (запущены или нет).

**Windows:**
```bash
status.bat
```

**Linux/Mac:**
```bash
./status.sh
```

## Установка и сборка

### install.bat / install.sh
Устанавливает все зависимости для backend и frontend.

**Windows:**
```bash
install.bat
```

**Linux/Mac:**
```bash
./install.sh
```

### build.bat / build.sh
Собирает production версию проекта.

**Windows:**
```bash
build.bat
```

**Linux/Mac:**
```bash
./build.sh
```

### clean.bat / clean.sh
Удаляет все собранные файлы, зависимости и базу данных.

**Windows:**
```bash
clean.bat
```

**Linux/Mac:**
```bash
./clean.sh
```

## Логи

### logs.bat / logs.sh
Показывает логи серверов.

**Windows:**
```bash
logs.bat [backend|frontend|all]
```

**Linux/Mac:**
```bash
./logs.sh [backend|frontend|all]
```

**Примеры:**
```bash
# Показать логи backend
logs.bat backend

# Показать логи frontend
logs.bat frontend

# Показать все логи
logs.bat all
```

## Быстрый старт

1. Установите зависимости:
```bash
install.bat  # или ./install.sh
```

2. Запустите серверы:
```bash
start.bat    # или ./start.sh
```

3. Проверьте статус:
```bash
status.bat   # или ./status.sh
```

4. Откройте браузер:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000

## Разработка

Для разработки можно запускать серверы отдельно:

**Backend:**
```bash
cd backend
go run main.go
```

**Frontend:**
```bash
cd clients/web
npm run dev
```

## Production

1. Соберите проект:
```bash
build.bat    # или ./build.sh
```

2. Файлы будут в:
- Backend: `backend/use-server.exe` (или `use-server`)
- Frontend: `clients/web/dist/`

## Конфигурация

Скопируйте `.env.example` в `.env` и настройте:

```bash
cp .env.example .env
```

Отредактируйте переменные окружения под ваши нужды.

## Порты

- Backend: 4000
- Frontend: 3000

Для изменения портов отредактируйте `config.json`.
