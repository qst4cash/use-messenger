#!/bin/bash

# Все команды для выполнения на сервере
cat << 'COMMANDS' > /tmp/deploy-commands.sh
#!/bin/bash
set -e

echo "=========================================="
echo "Начало деплоя USE Messenger"
echo "=========================================="

# Обновление системы
echo "[1/10] Обновление системы..."
apt-get update -qq

# Установка Docker
echo "[2/10] Установка Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
else
    echo "Docker уже установлен"
fi

# Установка зависимостей
echo "[3/10] Установка зависимостей..."
apt-get install -y docker-compose nginx certbot git curl -qq

# Клонирование проекта
echo "[4/10] Клонирование проекта..."
cd /opt
rm -rf use-messenger
git clone https://github.com/qst4cash/use-messenger.git
cd use-messenger

# Создание .env файла
echo "[5/10] Создание .env файла..."
JWT_SECRET=\$(openssl rand -hex 32)
cat > .env << EOF
JWT_SECRET=\${JWT_SECRET}
ALLOWED_ORIGINS=https://usecommunity.online
EOF

# Создание директорий
echo "[6/10] Создание директорий..."
mkdir -p data uploads logs ssl backups

# Получение SSL сертификата
echo "[7/10] Получение SSL сертификата..."
systemctl stop nginx 2>/dev/null || true
certbot certonly --standalone \
  -d usecommunity.online \
  --non-interactive \
  --agree-tos \
  --email admin@usecommunity.online \
  --force-renewal

# Копирование SSL сертификатов
cp /etc/letsencrypt/live/usecommunity.online/fullchain.pem ./ssl/cert.pem
cp /etc/letsencrypt/live/usecommunity.online/privkey.pem ./ssl/key.pem
chmod 644 ./ssl/cert.pem
chmod 600 ./ssl/key.pem

# Настройка Nginx
echo "[8/10] Настройка Nginx..."
cat > /etc/nginx/sites-available/usecommunity.online << 'NGINXEOF'
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
NGINXEOF

ln -sf /etc/nginx/sites-available/usecommunity.online /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx

# Сборка и запуск Docker
echo "[9/10] Сборка Docker образа (это займет 5-10 минут)..."
cd /opt/use-messenger
docker-compose up -d --build

# Проверка статуса
echo "[10/10] Проверка статуса..."
sleep 5
docker-compose ps

echo ""
echo "=========================================="
echo "ДЕПЛОЙ ЗАВЕРШЕН!"
echo "=========================================="
echo ""
echo "Сайт: https://usecommunity.online"
echo "API: https://usecommunity.online/api/users"
echo ""
echo "Логи: docker-compose logs -f"
echo ""
COMMANDS

chmod +x /tmp/deploy-commands.sh

echo "Скрипт деплоя создан: /tmp/deploy-commands.sh"
echo ""
echo "Для выполнения на сервере:"
echo "1. Скопируйте скрипт на сервер:"
echo "   scp /tmp/deploy-commands.sh root@138.124.26.50:/tmp/"
echo ""
echo "2. Подключитесь к серверу:"
echo "   ssh root@138.124.26.50"
echo "   Пароль: TY0muYW1o5Kv"
echo ""
echo "3. Запустите скрипт:"
echo "   bash /tmp/deploy-commands.sh"
echo ""
