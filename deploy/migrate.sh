#!/bin/bash

# USE Messenger - Миграция на новый сервер
# Использование: ./migrate.sh <OLD_SERVER_IP> <NEW_SERVER_IP> <DOMAIN>

set -e

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

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
if [ "$#" -ne 3 ]; then
    error "Использование: $0 <OLD_SERVER_IP> <NEW_SERVER_IP> <DOMAIN>"
fi

OLD_SERVER=$1
NEW_SERVER=$2
DOMAIN=$3

log "=========================================="
log "USE Messenger - Миграция"
log "=========================================="
log "Старый сервер: ${OLD_SERVER}"
log "Новый сервер: ${NEW_SERVER}"
log "Домен: ${DOMAIN}"
log "=========================================="

# Проверка доступа к серверам
log "Проверка SSH доступа..."
if ! ssh -o ConnectTimeout=5 root@${OLD_SERVER} "echo 'OK'" > /dev/null 2>&1; then
    error "Не удается подключиться к старому серверу ${OLD_SERVER}"
fi
if ! ssh -o ConnectTimeout=5 root@${NEW_SERVER} "echo 'OK'" > /dev/null 2>&1; then
    error "Не удается подключиться к новому серверу ${NEW_SERVER}"
fi
log "✓ SSH доступ к обоим серверам работает"

# Создание backup на старом сервере
log "Создание backup на старом сервере..."
ssh root@${OLD_SERVER} << 'ENDSSH'
    cd /opt/use-messenger

    # Остановить контейнер для консистентности данных
    docker-compose stop

    # Создать backup
    tar -czf /tmp/use-backup.tar.gz data/ uploads/ .env

    # Запустить контейнер обратно
    docker-compose start

    echo "✓ Backup создан: /tmp/use-backup.tar.gz"
ENDSSH

log "✓ Backup создан на старом сервере"

# Получить JWT_SECRET со старого сервера
log "Получение JWT_SECRET..."
JWT_SECRET=$(ssh root@${OLD_SERVER} "cat /opt/use-messenger/.env | grep JWT_SECRET | cut -d= -f2")
if [ -z "$JWT_SECRET" ]; then
    error "Не удалось получить JWT_SECRET со старого сервера"
fi
log "✓ JWT_SECRET получен: ${JWT_SECRET:0:10}..."

# Копирование backup на новый сервер
log "Копирование backup на новый сервер..."
ssh root@${OLD_SERVER} "cat /tmp/use-backup.tar.gz" | ssh root@${NEW_SERVER} "cat > /tmp/use-backup.tar.gz"
log "✓ Backup скопирован"

# Установка зависимостей на новом сервере
log "Установка зависимостей на новом сервере..."
ssh root@${NEW_SERVER} << 'ENDSSH'
    apt-get update -qq

    # Docker
    if ! command -v docker &> /dev/null; then
        curl -fsSL https://get.docker.com | sh
    fi

    # Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        apt-get install -y docker-compose
    fi

    # Другие зависимости
    apt-get install -y nginx certbot git curl -qq

    echo "✓ Зависимости установлены"
ENDSSH

log "✓ Зависимости установлены"

# Клонирование проекта на новый сервер
log "Клонирование проекта на новый сервер..."
ssh root@${NEW_SERVER} << 'ENDSSH'
    cd /opt

    if [ -d "use-messenger" ]; then
        rm -rf use-messenger
    fi

    git clone https://github.com/qst4cash/use-messenger.git
    cd use-messenger

    echo "✓ Проект склонирован"
ENDSSH

log "✓ Проект склонирован"

# Распаковка backup
log "Распаковка backup..."
ssh root@${NEW_SERVER} << 'ENDSSH'
    cd /opt/use-messenger
    tar -xzf /tmp/use-backup.tar.gz

    # Проверка
    if [ ! -f "data/use.db" ]; then
        echo "✗ База данных не найдена!"
        exit 1
    fi

    if [ ! -f ".env" ]; then
        echo "✗ .env файл не найден!"
        exit 1
    fi

    echo "✓ Backup распакован"
    echo "  - База данных: $(ls -lh data/use.db | awk '{print $5}')"
    echo "  - Uploads: $(du -sh uploads | awk '{print $1}')"
ENDSSH

log "✓ Backup распакован"

# Создание директорий
log "Создание дополнительных директорий..."
ssh root@${NEW_SERVER} << 'ENDSSH'
    cd /opt/use-messenger
    mkdir -p logs ssl backups
    chmod 755 logs ssl backups
    echo "✓ Директории созданы"
ENDSSH

log "✓ Директории созданы"

# Получение SSL сертификата
log "Получение SSL сертификата..."
ssh root@${NEW_SERVER} << ENDSSH
    systemctl stop nginx 2>/dev/null || true

    certbot certonly --standalone \
        -d ${DOMAIN} \
        --non-interactive \
        --agree-tos \
        --email admin@${DOMAIN} \
        --force-renewal

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
ssh root@${NEW_SERVER} << ENDSSH
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

    ln -sf /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    nginx -t
    systemctl restart nginx
    systemctl enable nginx

    echo "✓ Nginx настроен"
ENDSSH

log "✓ Nginx настроен"

# Сборка и запуск
log "Сборка Docker образа (5-10 минут)..."
ssh root@${NEW_SERVER} << 'ENDSSH'
    cd /opt/use-messenger
    docker-compose up -d --build
    echo "✓ Docker контейнер запущен"
ENDSSH

log "✓ Docker контейнер запущен"

# Ожидание запуска
log "Ожидание запуска приложения..."
sleep 15

# Проверка работы
log "Проверка работы на новом сервере..."
ssh root@${NEW_SERVER} << 'ENDSSH'
    cd /opt/use-messenger

    if ! docker-compose ps | grep -q "Up"; then
        echo "✗ Контейнер не запущен"
        docker-compose logs --tail=50
        exit 1
    fi

    # Проверка базы данных
    USER_COUNT=$(docker exec use-messenger sqlite3 /app/data/use.db "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0")
    echo "✓ Контейнер работает"
    echo "  - Пользователей в БД: ${USER_COUNT}"
ENDSSH

log "✓ Контейнер работает"

# Настройка backup
log "Настройка автоматического backup..."
ssh root@${NEW_SERVER} << 'ENDSSH'
    cat > /opt/use-messenger/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/use-messenger/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
cp /opt/use-messenger/data/use.db $BACKUP_DIR/use_$DATE.db
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /opt/use-messenger/uploads
find $BACKUP_DIR -name "*.db" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
echo "Backup completed: $DATE"
EOF

    chmod +x /opt/use-messenger/backup.sh
    (crontab -l 2>/dev/null; echo "0 3 * * * /opt/use-messenger/backup.sh >> /opt/use-messenger/logs/backup.log 2>&1") | crontab -
    (crontab -l 2>/dev/null; echo "0 0 1 * * certbot renew --quiet && systemctl reload nginx") | crontab -

    echo "✓ Backup и SSL renewal настроены"
ENDSSH

log "✓ Автоматизация настроена"

# Инструкции по изменению DNS
log "=========================================="
log "МИГРАЦИЯ ПОЧТИ ЗАВЕРШЕНА!"
log "=========================================="
log ""
warning "ВАЖНО: Теперь нужно изменить DNS!"
log ""
log "1. Зайдите в панель управления доменом ${DOMAIN}"
log "2. Найдите A запись для домена"
log "3. Измените IP адрес:"
log "   Было: ${OLD_SERVER}"
log "   Стало: ${NEW_SERVER}"
log "4. Сохраните изменения"
log "5. Подождите 5-15 минут для распространения DNS"
log ""
log "Проверка DNS:"
log "  nslookup ${DOMAIN}"
log "  dig ${DOMAIN} +short"
log ""
log "После изменения DNS:"
log "  Сайт: https://${DOMAIN}"
log "  API: https://${DOMAIN}/api/users"
log ""
log "Старый сервер можно выключить через 24 часа"
log "после проверки работы нового сервера."
log ""
log "=========================================="

# Сохранить информацию о миграции
cat > migration-info.txt << EOF
USE Messenger - Информация о миграции
=====================================
Дата: $(date)
Старый сервер: ${OLD_SERVER}
Новый сервер: ${NEW_SERVER}
Домен: ${DOMAIN}
JWT Secret: ${JWT_SECRET}

Что было перенесено:
  - База данных (data/use.db)
  - Загруженные файлы (uploads/)
  - Конфигурация (.env)

Новый сервер:
  Сайт: https://${DOMAIN}
  API: https://${DOMAIN}/api/users
  SSH: ssh root@${NEW_SERVER}

Команды:
  cd /opt/use-messenger
  docker-compose ps
  docker-compose logs -f

Backup: /opt/use-messenger/backups/
SSL: Автопродление настроено

ВАЖНО:
  1. Измените DNS на ${NEW_SERVER}
  2. Подождите 5-15 минут
  3. Проверьте работу сайта
  4. Выключите старый сервер через 24 часа

Откат (если нужно):
  Измените DNS обратно на ${OLD_SERVER}
=====================================
EOF

log "Информация сохранена в migration-info.txt"
log ""
log "Готово! 🎉"
