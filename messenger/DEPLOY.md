# Инструкция по развёртыванию на сервере

## Переменные окружения

Создайте файл `.env` или экспортируйте переменные:

```bash
# Порт сервера (по умолчанию 4000)
PORT=4000

# База данных
DATABASE_PATH=/opt/messenger/use.db

# JWT секрет (обязательно измените для продакшена!)
JWT_SECRET=your-super-secret-key-change-this

# Разрешённые origin'ы (домены фронтенда)
# Для продакшена укажите ваш домен
ALLOWED_ORIGINS=https://your-domain.com,http://your-server-ip:4000

# ИЛИ разрешить все origin'ы (для отладки, не рекомендуется для продакшена)
ALLOW_ALL_ORIGINS=true

# Пути для загрузки файлов (абсолютные пути!)
UPLOAD_DIR=/opt/messenger/uploads

# SSL (опционально)
# SSL_CERT_FILE=/path/to/cert.pem
# SSL_KEY_FILE=/path/to/key.pem
```

## Запуск

```bash
# 1. Создать директорию
sudo mkdir -p /opt/messenger
cd /opt/messenger

# 2. Скопировать файлы
cp -r backend/* /opt/messenger/
# или собрать бинарник:
cd backend
go build -o messenger .
cp messenger /opt/messenger/

# 3. Создать директорию для загрузок с правильными правами
sudo mkdir -p /opt/messenger/uploads/{avatars,files/image,files/video,files/audio}
sudo chmod -R 755 /opt/messenger/uploads
sudo chown -R $(whoami):$(whoami) /opt/messenger/uploads

# 4. Запустить
export JWT_SECRET="your-secret-key"
export ALLOWED_ORIGINS="https://your-domain.com"
export DATABASE_PATH="/opt/messenger/use.db"
./messenger
```

## Запуск как systemd-сервис

Создайте `/etc/systemd/system/messenger.service`:

```ini
[Unit]
Description=Messenger Backend
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/messenger
ExecStart=/opt/messenger/messenger
Restart=always
Environment="JWT_SECRET=your-secret-key"
Environment="ALLOWED_ORIGINS=https://your-domain.com"
Environment="DATABASE_PATH=/opt/messenger/use.db"
Environment="ALLOW_ALL_ORIGINS=true"

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable messenger
sudo systemctl start messenger
sudo systemctl status messenger
```

## Логирование

```bash
# Просмотр логов
journalctl -u messenger -f

# Логи за последний час
journalctl -u messenger --since "1 hour ago"
```

## Отладка проблем

### Аватарки не загружаются

1. Проверьте права на директорию:
```bash
ls -la /opt/messenger/uploads/avatars/
```

2. Проверьте логи приложения:
```bash
journalctl -u messenger | grep -i avatar
```

### WebSocket не подключается

1. Включите `ALLOW_ALL_ORIGINS=true` для теста

2. Проверьте, что порт открыт:
```bash
sudo ufw allow 4000/tcp
```

3. Проверьте логи:
```bash
journalctl -u messenger | grep -i websocket
```

### Сообщения не отправляются

1. Проверьте подключение к WebSocket в браузере (F12 → Network → WS)

2. Проверьте CORS ошибки в консоли браузера

3. Включите логирование в `websocket.go`

## Nginx reverse proxy (опционально)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_read_timeout 86400;
    }
}
```
