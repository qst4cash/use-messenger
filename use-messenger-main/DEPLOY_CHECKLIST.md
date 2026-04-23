# USE Messenger - Финальный чеклист деплоя

**Дата:** 2026-04-22  
**Цель:** Подготовить проект к деплою на новый сервер с 2GB+ RAM

---

## Текущее состояние проекта

### ✅ Готово
- [x] Dockerfile (multi-stage build)
- [x] docker-compose.yml (версия 3.3)
- [x] .env.example (шаблон переменных)
- [x] Backend исправлен (JWT, CORS, WebSocket, Database path)
- [x] Frontend исправлен (wss://, современный scrollbar)
- [x] Скрипты управления (start.bat/sh, stop.bat/sh, etc.)
- [x] Документация (README, DOCKER.md, QUICKSTART.md)
- [x] Git репозиторий настроен
- [x] SSL скрипты (deploy/generate-ssl.sh)

### ⚠️ Известные проблемы
- Текущий сервер (144.31.69.7) имеет только 1GB RAM
- Docker build падает из-за нехватки памяти при компиляции Go
- WebSocket не работает на текущем сервере (нужна пересборка)

---

## План деплоя на новый сервер

### Вариант 1: Новый сервер с 2GB+ RAM (Рекомендуется)

#### Шаг 1: Подготовка нового сервера
```bash
# Подключение к новому серверу
ssh root@<NEW_SERVER_IP>

# Установка Docker
curl -fsSL https://get.docker.com | sh
apt install -y docker-compose certbot nginx git

# Проверка памяти
free -h  # Должно быть минимум 2GB
```

#### Шаг 2: Клонирование проекта
```bash
cd /opt
git clone https://github.com/qst4cash/use-messenger.git
cd use-messenger
```

#### Шаг 3: Настройка окружения
```bash
# Создание .env файла
cat > .env << 'EOF'
JWT_SECRET=$(openssl rand -hex 32)
ALLOWED_ORIGINS=https://usecommunity.online
EOF

# Создание директорий
mkdir -p data uploads logs ssl
```

#### Шаг 4: Получение SSL сертификата
```bash
# Остановить Nginx если запущен
systemctl stop nginx

# Получить сертификат
certbot certonly --standalone \
  -d usecommunity.online \
  --non-interactive \
  --agree-tos \
  --email admin@usecommunity.online

# Скопировать сертификаты
cp /etc/letsencrypt/live/usecommunity.online/fullchain.pem ./ssl/cert.pem
cp /etc/letsencrypt/live/usecommunity.online/privkey.pem ./ssl/key.pem
chmod 644 ./ssl/cert.pem
chmod 600 ./ssl/key.pem
```

#### Шаг 5: Настройка Nginx
```bash
cat > /etc/nginx/sites-available/usecommunity.online << 'EOF'
server {
    listen 80;
    server_name usecommunity.online www.usecommunity.online;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name usecommunity.online www.usecommunity.online;

    ssl_certificate /etc/letsencrypt/live/usecommunity.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/usecommunity.online/privkey.pem;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host localhost:4000;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /ws {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host localhost:4000;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

ln -s /etc/nginx/sites-available/usecommunity.online /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

#### Шаг 6: Миграция данных (если есть старый сервер)
```bash
# На старом сервере
ssh root@144.31.69.7
cd /opt/use-messenger
tar -czf /tmp/use-backup.tar.gz data/ uploads/ .env

# На новом сервере
scp root@144.31.69.7:/tmp/use-backup.tar.gz /tmp/
cd /opt/use-messenger
tar -xzf /tmp/use-backup.tar.gz

# Проверка
ls -la data/use.db
cat .env | grep JWT_SECRET
```

#### Шаг 7: Сборка и запуск
```bash
cd /opt/use-messenger

# Сборка (займет 5-10 минут)
docker-compose up -d --build

# Проверка логов
docker-compose logs -f
```

#### Шаг 8: Изменение DNS
В панели управления доменом:
- Type: A
- Name: @
- Value: <NEW_SERVER_IP>
- TTL: 300

Ждать 5-15 минут.

#### Шаг 9: Проверка работы
```bash
# Проверка API
curl https://usecommunity.online/api/users

# Проверка контейнера
docker-compose ps
docker-compose logs --tail=50

# Проверка базы данных
docker exec use-messenger sqlite3 /app/data/use.db "SELECT COUNT(*) FROM users;"
```

---

### Вариант 2: Локальная сборка + загрузка образа

Если нет доступа к серверу с 2GB RAM:

#### На локальной машине (Windows)
```bash
cd C:\USE

# Установить Docker Desktop
# https://www.docker.com/products/docker-desktop

# Собрать образ
docker build -t use-messenger:latest .

# Сохранить образ
docker save use-messenger:latest | gzip > use-messenger.tar.gz

# Загрузить на сервер
scp use-messenger.tar.gz root@<SERVER_IP>:/tmp/
```

#### На сервере
```bash
# Загрузить образ
docker load < /tmp/use-messenger.tar.gz

# Запустить
cd /opt/use-messenger
docker-compose up -d
```

---

### Вариант 3: GitHub Actions (Автоматизация)

Создать `.github/workflows/deploy.yml`:

```yaml
name: Deploy to VPS

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: docker build -t use-messenger:latest .
      
      - name: Save image
        run: docker save use-messenger:latest | gzip > use-messenger.tar.gz
      
      - name: Deploy to server
        uses: appleboy/scp-action@master
        with:
          host: ${{ secrets.SERVER_IP }}
          username: root
          key: ${{ secrets.SSH_KEY }}
          source: "use-messenger.tar.gz"
          target: "/tmp/"
      
      - name: Load and restart
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_IP }}
          username: root
          key: ${{ secrets.SSH_KEY }}
          script: |
            docker load < /tmp/use-messenger.tar.gz
            cd /opt/use-messenger
            docker-compose up -d
```

---

## Чеклист перед деплоем

### Локальная подготовка
- [ ] Все изменения закоммичены в Git
- [ ] Проект собирается локально без ошибок
- [ ] .env.example актуален
- [ ] Документация обновлена
- [ ] Тесты пройдены (если есть)

### Подготовка сервера
- [ ] Сервер имеет минимум 2GB RAM
- [ ] Docker установлен
- [ ] Docker Compose установлен
- [ ] Nginx установлен
- [ ] Certbot установлен
- [ ] Порты 80, 443, 4000 открыты
- [ ] SSH доступ настроен

### Конфигурация
- [ ] .env файл создан с правильным JWT_SECRET
- [ ] ALLOWED_ORIGINS настроен на домен
- [ ] SSL сертификаты получены
- [ ] Nginx сконфигурирован
- [ ] DNS указывает на новый сервер

### Миграция данных (если применимо)
- [ ] Backup данных со старого сервера создан
- [ ] JWT_SECRET скопирован (важно!)
- [ ] data/use.db перенесена
- [ ] uploads/ перенесены
- [ ] .env перенесен

### Деплой
- [ ] Docker образ собран успешно
- [ ] Контейнер запущен
- [ ] Логи не показывают ошибок
- [ ] API отвечает (curl https://domain/api/users)
- [ ] Frontend загружается
- [ ] WebSocket подключается
- [ ] Отправка сообщений работает
- [ ] Загрузка файлов работает

### Post-deploy
- [ ] SSL сертификат валиден
- [ ] Автопродление SSL настроено (cron)
- [ ] Backup скрипт настроен
- [ ] Мониторинг настроен (опционально)
- [ ] Webhook для автодеплоя настроен (опционально)

---

## Команды для проверки

```bash
# Статус контейнера
docker-compose ps

# Логи
docker-compose logs -f use-messenger

# Проверка API
curl https://usecommunity.online/api/users

# Проверка WebSocket (в браузере)
# Открыть https://usecommunity.online
# Попробовать отправить сообщение

# Проверка базы данных
docker exec use-messenger sqlite3 /app/data/use.db "SELECT * FROM users;"

# Проверка памяти
free -h
docker stats use-messenger

# Проверка SSL
openssl s_client -connect usecommunity.online:443 -servername usecommunity.online

# Проверка Nginx
nginx -t
systemctl status nginx
```

---

## Откат в случае проблем

```bash
# Остановить контейнер
docker-compose down

# Вернуть DNS на старый сервер (если был)
# В панели управления доменом изменить A запись

# Или запустить старую версию
git checkout <OLD_COMMIT>
docker-compose up -d --build
```

---

## Автоматизация backup

Создать `/opt/use-messenger/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/opt/use-messenger/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup базы данных
cp /opt/use-messenger/data/use.db $BACKUP_DIR/use_$DATE.db

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /opt/use-messenger/uploads

# Удалить старые backup (старше 7 дней)
find $BACKUP_DIR -name "*.db" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

Добавить в cron:
```bash
crontab -e
# Backup каждый день в 3:00
0 3 * * * /opt/use-messenger/backup.sh >> /opt/use-messenger/logs/backup.log 2>&1
```

---

## Автопродление SSL

```bash
crontab -e
# Продление SSL каждый месяц
0 0 1 * * certbot renew --quiet && systemctl reload nginx
```

---

## Контакты и ссылки

- **Домен:** https://usecommunity.online
- **GitHub:** https://github.com/qst4cash/use-messenger
- **Текущий сервер:** 144.31.69.7 (1GB RAM - недостаточно)
- **Новый сервер:** <УКАЗАТЬ_IP> (минимум 2GB RAM)

---

## Следующие шаги

1. ✅ Проект готов к деплою
2. ⏳ Получить сервер с 2GB+ RAM
3. ⏳ Выполнить деплой по чеклисту
4. ⏳ Настроить автоматизацию (backup, SSL renewal)
5. ⏳ Настроить мониторинг (опционально)

---

**Статус:** Проект полностью подготовлен к деплою. Все файлы готовы, документация актуальна.
