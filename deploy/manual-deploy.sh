#!/bin/bash

# USE Messenger - Ручной деплой (команды для копирования)
# Сервер: 138.124.26.50
# Домен: usecommunity.online
# Пароль: TY0muYW1o5Kv

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║          USE Messenger - Ручной деплой                     ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Сервер: 138.124.26.50"
echo "Домен: usecommunity.online"
echo "Пароль: TY0muYW1o5Kv"
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""
echo "ШАГ 1: Подключитесь к серверу"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "ssh root@138.124.26.50"
echo ""
echo "Введите пароль: TY0muYW1o5Kv"
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""
echo "ШАГ 2: Выполните на сервере (скопируйте все команды)"
echo "════════════════════════════════════════════════════════════"
echo ""

cat << 'EOF'
# Обновление системы
apt-get update -qq

# Установка Docker
curl -fsSL https://get.docker.com | sh

# Установка зависимостей
apt-get install -y docker-compose nginx certbot git curl

# Клонирование проекта
cd /opt
rm -rf use-messenger
git clone https://github.com/qst4cash/use-messenger.git
cd use-messenger

# Создание .env файла
JWT_SECRET=$(openssl rand -hex 32)
cat > .env << ENVEOF
JWT_SECRET=${JWT_SECRET}
ALLOWED_ORIGINS=https://usecommunity.online
ENVEOF

# Создание директорий
mkdir -p data uploads logs ssl backups

# Получение SSL сертификата
systemctl stop nginx 2>/dev/null || true
certbot certonly --standalone \
  -d usecommunity.online \
  --non-interactive \
  --agree-tos \
  --email admin@usecommunity.online

# Копирование SSL сертификатов
cp /etc/letsencrypt/live/usecommunity.online/fullchain.pem ./ssl/cert.pem
cp /etc/letsencrypt/live/usecommunity.online/privkey.pem ./ssl/key.pem
chmod 644 ./ssl/cert.pem
chmod 600 ./ssl/key.pem

# Настройка Nginx
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

# Активация Nginx конфигурации
ln -sf /etc/nginx/sites-available/usecommunity.online /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx

# Сборка и запуск Docker (5-10 минут)
cd /opt/use-messenger
docker-compose up -d --build

# Проверка статуса
docker-compose ps
docker-compose logs --tail=20

echo ""
echo "════════════════════════════════════════════════════════════"
echo "ДЕПЛОЙ ЗАВЕРШЕН!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Сайт: https://usecommunity.online"
echo "API: https://usecommunity.online/api/users"
echo ""
echo "Проверка:"
echo "curl https://usecommunity.online/api/users"
echo ""
EOF

echo ""
echo "════════════════════════════════════════════════════════════"
echo ""
echo "ШАГ 3: После выполнения всех команд"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Откройте в браузере: https://usecommunity.online"
echo ""
echo "Если нужно посмотреть логи:"
echo "  docker-compose logs -f"
echo ""
echo "Если нужно перезапустить:"
echo "  docker-compose restart"
echo ""
echo "════════════════════════════════════════════════════════════"
