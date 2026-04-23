#!/bin/bash

# USE Messenger - Полный автоматический деплой на новый сервер
# Использование: ./full-deploy.sh <SERVER_IP> <DOMAIN>

set -e  # Остановка при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция для вывода
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Проверка аргументов
if [ "$#" -ne 2 ]; then
    error "Использование: $0 <SERVER_IP> <DOMAIN>"
fi

SERVER_IP=$1
DOMAIN=$2
EMAIL="admin@${DOMAIN}"

log "=========================================="
log "USE Messenger - Автоматический деплой"
log "=========================================="
log "Сервер: ${SERVER_IP}"
log "Домен: ${DOMAIN}"
log "Email: ${EMAIL}"
log "=========================================="

# Проверка SSH доступа
log "Проверка SSH доступа к серверу..."
if ! ssh -o ConnectTimeout=5 root@${SERVER_IP} "echo 'SSH OK'" > /dev/null 2>&1; then
    error "Не удается подключиться к серверу ${SERVER_IP}. Проверьте SSH доступ."
fi
log "✓ SSH доступ работает"

# Проверка памяти на сервере
log "Проверка памяти на сервере..."
MEMORY=$(ssh root@${SERVER_IP} "free -m | awk '/^Mem:/{print \$2}'")
if [ "$MEMORY" -lt 1800 ]; then
    warning "На сервере только ${MEMORY}MB RAM. Рекомендуется минимум 2GB для сборки Docker образа."
    read -p "Продолжить? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    log "✓ Памяти достаточно: ${MEMORY}MB"
fi

# Установка зависимостей на сервере
log "Установка Docker и зависимостей..."
ssh root@${SERVER_IP} << 'ENDSSH'
    # Обновление системы
    apt-get update -qq

    # Установка Docker
    if ! command -v docker &> /dev/null; then
        echo "Установка Docker..."
        curl -fsSL https://get.docker.com | sh
    else
        echo "Docker уже установлен"
    fi

    # Установка Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        echo "Установка Docker Compose..."
        apt-get install -y docker-compose
    else
        echo "Docker Compose уже установлен"
    fi

    # Установка других зависимостей
    apt-get install -y nginx certbot git curl -qq

    echo "✓ Все зависимости установлены"
ENDSSH

log "✓ Зависимости установлены"

# Клонирование проекта
log "Клонирование проекта на сервер..."
ssh root@${SERVER_IP} << ENDSSH
    cd /opt

    # Удалить старую версию если есть
    if [ -d "use-messenger" ]; then
        echo "Удаление старой версии..."
        rm -rf use-messenger
    fi

    # Клонирование
    git clone https://github.com/qst4cash/use-messenger.git
    cd use-messenger

    echo "✓ Проект склонирован"
ENDSSH

log "✓ Проект склонирован"

# Создание .env файла
log "Создание .env файла..."
JWT_SECRET=$(openssl rand -hex 32)
ssh root@${SERVER_IP} << ENDSSH
    cd /opt/use-messenger

    cat > .env << EOF
JWT_SECRET=${JWT_SECRET}
ALLOWED_ORIGINS=https://${DOMAIN}
EOF

    echo "✓ .env файл создан"
ENDSSH

log "✓ .env файл создан"

# Создание директорий
log "Создание директорий..."
ssh root@${SERVER_IP} << 'ENDSSH'
    cd /opt/use-messenger
    mkdir -p data uploads logs ssl backups
    chmod 755 data uploads logs ssl backups
    echo "✓ Директории созданы"
ENDSSH

log "✓ Директории созданы"

# Получение SSL сертификата
log "Получение SSL сертификата..."
ssh root@${SERVER_IP} << ENDSSH
    # Остановить Nginx если запущен
    systemctl stop nginx 2>/dev/null || true

    # Получить сертификат
    certbot certonly --standalone \
        -d ${DOMAIN} \
        --non-interactive \
        --agree-tos \
        --email ${EMAIL} \
        --force-renewal

    # Скопировать сертификаты
    cd /opt/use-messenger
    cp /etc/letsencrypt/live/${DOMAIN}/fullchain.pem ./ssl/cert.pem
    cp /etc/letsencrypt/live/${DOMAIN}/privkey.pem ./ssl/key.pem
    chmod 644 ./ssl/cert.pem
    chmod 600 ./ssl/key.pem

    echo "✓ SSL сертификат получен"
ENDSSH

log "✓ SSL сертификат получен"

# Настройка Nginx
log "Настройка Nginx..."
ssh root@${SERVER_IP} << ENDSSH
    cat > /etc/nginx/sites-available/${DOMAIN} << 'EOF'
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
        proxy_set_header Connection "upgrade";
        proxy_set_header Host localhost:4000;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /ws {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host localhost:4000;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF

    # Активировать конфигурацию
    ln -sf /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default

    # Проверить конфигурацию
    nginx -t

    # Запустить Nginx
    systemctl restart nginx
    systemctl enable nginx

    echo "✓ Nginx настроен"
ENDSSH

log "✓ Nginx настроен"

# Сборка и запуск Docker контейнера
log "Сборка Docker образа (это займет 5-10 минут)..."
ssh root@${SERVER_IP} << 'ENDSSH'
    cd /opt/use-messenger

    # Сборка
    docker-compose up -d --build

    echo "✓ Docker контейнер запущен"
ENDSSH

log "✓ Docker контейнер запущен"

# Ожидание запуска
log "Ожидание запуска приложения..."
sleep 10

# Проверка работы
log "Проверка работы приложения..."
ssh root@${SERVER_IP} << 'ENDSSH'
    cd /opt/use-messenger

    # Проверка статуса контейнера
    if ! docker-compose ps | grep -q "Up"; then
        echo "✗ Контейнер не запущен"
        docker-compose logs --tail=50
        exit 1
    fi

    echo "✓ Контейнер работает"
ENDSSH

log "✓ Контейнер работает"

# Настройка автоматического backup
log "Настройка автоматического backup..."
ssh root@${SERVER_IP} << 'ENDSSH'
    cat > /opt/use-messenger/backup.sh << 'EOF'
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
EOF

    chmod +x /opt/use-messenger/backup.sh

    # Добавить в cron
    (crontab -l 2>/dev/null; echo "0 3 * * * /opt/use-messenger/backup.sh >> /opt/use-messenger/logs/backup.log 2>&1") | crontab -

    echo "✓ Backup настроен (каждый день в 3:00)"
ENDSSH

log "✓ Backup настроен"

# Настройка автопродления SSL
log "Настройка автопродления SSL..."
ssh root@${SERVER_IP} << 'ENDSSH'
    # Добавить в cron
    (crontab -l 2>/dev/null; echo "0 0 1 * * certbot renew --quiet && systemctl reload nginx") | crontab -

    echo "✓ Автопродление SSL настроено (каждый месяц)"
ENDSSH

log "✓ Автопродление SSL настроено"

# Финальная проверка
log "=========================================="
log "Финальная проверка..."
log "=========================================="

# Проверка API
log "Проверка API..."
if curl -s -o /dev/null -w "%{http_code}" https://${DOMAIN}/api/users | grep -q "200\|401"; then
    log "✓ API работает"
else
    warning "API не отвечает. Проверьте логи: ssh root@${SERVER_IP} 'cd /opt/use-messenger && docker-compose logs'"
fi

# Вывод информации
log "=========================================="
log "ДЕПЛОЙ ЗАВЕРШЕН УСПЕШНО!"
log "=========================================="
log ""
log "Сайт: https://${DOMAIN}"
log "API: https://${DOMAIN}/api/users"
log "Сервер: ${SERVER_IP}"
log ""
log "Полезные команды:"
log "  ssh root@${SERVER_IP}"
log "  cd /opt/use-messenger"
log "  docker-compose ps"
log "  docker-compose logs -f"
log "  docker-compose restart"
log ""
log "Backup:"
log "  Автоматический backup каждый день в 3:00"
log "  Расположение: /opt/use-messenger/backups/"
log ""
log "SSL:"
log "  Автопродление каждый месяц"
log "  Действителен до: $(ssh root@${SERVER_IP} "openssl x509 -enddate -noout -in /etc/letsencrypt/live/${DOMAIN}/cert.pem" | cut -d= -f2)"
log ""
log "=========================================="

# Сохранить информацию о деплое
cat > deploy-info.txt << EOF
USE Messenger - Информация о деплое
====================================
Дата: $(date)
Сервер: ${SERVER_IP}
Домен: ${DOMAIN}
JWT Secret: ${JWT_SECRET}

Доступ:
  Сайт: https://${DOMAIN}
  API: https://${DOMAIN}/api/users
  SSH: ssh root@${SERVER_IP}

Команды:
  cd /opt/use-messenger
  docker-compose ps
  docker-compose logs -f
  docker-compose restart

Backup: /opt/use-messenger/backups/
SSL: Автопродление настроено
====================================
EOF

log "Информация сохранена в deploy-info.txt"
log ""
log "Готово! 🎉"
