#!/bin/bash

# USE Messenger - Деплой с паролем (без SSH ключа)
# Использование: ./deploy-with-password.sh <SERVER_IP> <DOMAIN> <PASSWORD>

set -e

SERVER_IP=$1
DOMAIN=$2
PASSWORD=$3

if [ "$#" -ne 3 ]; then
    echo "Использование: $0 <SERVER_IP> <DOMAIN> <PASSWORD>"
    exit 1
fi

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

log "=========================================="
log "USE Messenger - Деплой с паролем"
log "=========================================="
log "Сервер: ${SERVER_IP}"
log "Домен: ${DOMAIN}"
log "=========================================="

# Функция для выполнения команд на сервере
remote_exec() {
    sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no root@${SERVER_IP} "$1"
}

# Функция для копирования файлов
remote_copy() {
    sshpass -p "$PASSWORD" scp -o StrictHostKeyChecking=no "$1" root@${SERVER_IP}:"$2"
}

# Проверка sshpass
if ! command -v sshpass &> /dev/null; then
    error "sshpass не установлен. Установите: apt-get install sshpass (Linux) или brew install hudochenkov/sshpass/sshpass (Mac)"
fi

log "Проверка подключения..."
if ! remote_exec "echo 'OK'" > /dev/null 2>&1; then
    error "Не удается подключиться к серверу"
fi
log "✓ Подключение работает"

log "Установка зависимостей..."
remote_exec "apt-get update -qq && apt-get install -y docker.io docker-compose nginx certbot git curl -qq"
log "✓ Зависимости установлены"

log "Клонирование проекта..."
remote_exec "cd /opt && rm -rf use-messenger && git clone https://github.com/qst4cash/use-messenger.git"
log "✓ Проект склонирован"

log "Создание .env файла..."
JWT_SECRET=$(openssl rand -hex 32)
remote_exec "cd /opt/use-messenger && cat > .env << EOF
JWT_SECRET=${JWT_SECRET}
ALLOWED_ORIGINS=https://${DOMAIN}
EOF"
log "✓ .env создан"

log "Создание директорий..."
remote_exec "cd /opt/use-messenger && mkdir -p data uploads logs ssl backups"
log "✓ Директории созданы"

log "Получение SSL сертификата..."
remote_exec "systemctl stop nginx 2>/dev/null || true"
remote_exec "certbot certonly --standalone -d ${DOMAIN} --non-interactive --agree-tos --email admin@${DOMAIN} --force-renewal"
remote_exec "cd /opt/use-messenger && cp /etc/letsencrypt/live/${DOMAIN}/fullchain.pem ./ssl/cert.pem && cp /etc/letsencrypt/live/${DOMAIN}/privkey.pem ./ssl/key.pem && chmod 644 ./ssl/cert.pem && chmod 600 ./ssl/key.pem"
log "✓ SSL сертификат получен"

log "Настройка Nginx..."
remote_exec "cat > /etc/nginx/sites-available/${DOMAIN} << 'EOF'
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN} www.${DOMAIN};

    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \"upgrade\";
        proxy_set_header Host localhost:4000;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /ws {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \"upgrade\";
        proxy_set_header Host localhost:4000;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF"

remote_exec "ln -sf /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/ && rm -f /etc/nginx/sites-enabled/default && nginx -t && systemctl restart nginx"
log "✓ Nginx настроен"

log "Сборка Docker образа (5-10 минут)..."
remote_exec "cd /opt/use-messenger && docker-compose up -d --build"
log "✓ Docker контейнер запущен"

log "=========================================="
log "ДЕПЛОЙ ЗАВЕРШЕН!"
log "=========================================="
log ""
log "Сайт: https://${DOMAIN}"
log "API: https://${DOMAIN}/api/users"
log ""
log "Проверка:"
log "  curl https://${DOMAIN}/api/users"
log ""
log "=========================================="
