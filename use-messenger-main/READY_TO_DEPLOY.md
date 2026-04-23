# USE Messenger - Готов к деплою! 🚀

**Дата подготовки:** 2026-04-22  
**Статус:** ✅ Полностью готов к production деплою

---

## 📋 Что готово

### ✅ Код и конфигурация
- [x] Backend (Go) - все баги исправлены
- [x] Frontend (React) - оптимизирован
- [x] Dockerfile - multi-stage build
- [x] docker-compose.yml - production ready
- [x] .env.example - шаблон переменных
- [x] Nginx конфигурация
- [x] SSL поддержка

### ✅ Скрипты деплоя
- [x] `deploy/full-deploy.sh` - полный автоматический деплой
- [x] `deploy/migrate.sh` - миграция с текущего сервера
- [x] `deploy/generate-ssl.sh` - генерация SSL
- [x] `deploy/deploy.sh` - базовый деплой

### ✅ Документация
- [x] `DEPLOY_CHECKLIST.md` - полный чеклист
- [x] `DOCKER.md` - Docker документация
- [x] `README.md` - основная документация
- [x] `QUICKSTART.md` - быстрый старт

### ✅ Автоматизация
- [x] Автоматический backup (cron)
- [x] Автопродление SSL (cron)
- [x] Скрипты управления (start/stop/status)

---

## 🚀 Быстрый деплой (3 варианта)

### Вариант 1: Новый сервер (Рекомендуется)

**Требования:**
- Сервер с минимум 2GB RAM
- Ubuntu 20.04+ или Debian 10+
- SSH доступ (root)
- Домен с настроенным DNS

**Команда:**
```bash
cd C:\USE\deploy
chmod +x full-deploy.sh
./full-deploy.sh <SERVER_IP> <DOMAIN>

# Пример:
./full-deploy.sh 123.45.67.89 usecommunity.online
```

**Что делает скрипт:**
1. Проверяет SSH доступ
2. Устанавливает Docker, Nginx, Certbot
3. Клонирует проект
4. Создает .env с JWT_SECRET
5. Получает SSL сертификат
6. Настраивает Nginx
7. Собирает и запускает Docker контейнер
8. Настраивает автоматический backup
9. Настраивает автопродление SSL

**Время:** ~15-20 минут

---

### Вариант 2: Миграция с текущего сервера

**Если у вас уже есть данные на сервере 144.31.69.7:**

```bash
cd C:\USE\deploy
chmod +x migrate.sh
./migrate.sh 144.31.69.7 <NEW_SERVER_IP> usecommunity.online

# Пример:
./migrate.sh 144.31.69.7 123.45.67.89 usecommunity.online
```

**Что делает скрипт:**
1. Создает backup на старом сервере
2. Копирует JWT_SECRET (важно!)
3. Переносит данные (БД + uploads)
4. Настраивает новый сервер
5. Запускает приложение
6. Выдает инструкции по изменению DNS

**Время:** ~20-25 минут

---

### Вариант 3: Локальная сборка + загрузка

**Если на сервере мало памяти (<2GB):**

```bash
# На локальной машине (Windows)
cd C:\USE

# Установить Docker Desktop
# https://www.docker.com/products/docker-desktop

# Собрать образ
docker build -t use-messenger:latest .

# Сохранить
docker save use-messenger:latest | gzip > use-messenger.tar.gz

# Загрузить на сервер
scp use-messenger.tar.gz root@<SERVER_IP>:/tmp/

# На сервере
ssh root@<SERVER_IP>
docker load < /tmp/use-messenger.tar.gz
cd /opt/use-messenger
docker-compose up -d
```

**Время:** ~30-40 минут

---

## 📝 Ручной деплой (пошагово)

Если хотите контролировать каждый шаг, следуйте инструкциям в:
- `DEPLOY_CHECKLIST.md` - полный чеклист с командами

---

## 🔧 Требования к серверу

### Минимальные
- **RAM:** 2GB (для сборки Docker образа)
- **Диск:** 10GB свободного места
- **CPU:** 1 ядро
- **ОС:** Ubuntu 20.04+ / Debian 10+ / CentOS 8+

### Рекомендуемые
- **RAM:** 4GB
- **Диск:** 20GB SSD
- **CPU:** 2 ядра
- **ОС:** Ubuntu 22.04 LTS

### Порты
- **80** - HTTP (redirect на HTTPS)
- **443** - HTTPS
- **4000** - Backend (внутри контейнера)

---

## 🌐 DNS настройка

Перед деплоем настройте DNS:

```
Type: A
Name: @
Value: <SERVER_IP>
TTL: 300 (5 минут)
```

Для поддомена:
```
Type: A
Name: app
Value: <SERVER_IP>
TTL: 300
```

Проверка DNS:
```bash
nslookup usecommunity.online
dig usecommunity.online +short
```

---

## 🔐 Безопасность

### Что уже настроено
- ✅ JWT authentication
- ✅ CORS whitelist
- ✅ HTTPS (SSL)
- ✅ Secure password hashing (bcrypt)
- ✅ Thread-safe WebSocket
- ✅ Environment variables для секретов

### Рекомендации
- Используйте сильный JWT_SECRET (32+ символов)
- Регулярно обновляйте зависимости
- Настройте firewall (ufw)
- Используйте fail2ban для защиты SSH
- Регулярно делайте backup

---

## 📊 Мониторинг

### Проверка статуса
```bash
# SSH на сервер
ssh root@<SERVER_IP>

# Статус контейнера
cd /opt/use-messenger
docker-compose ps

# Логи
docker-compose logs -f

# Использование ресурсов
docker stats use-messenger

# Проверка API
curl https://usecommunity.online/api/users
```

### Логи
- **Приложение:** `docker-compose logs -f`
- **Nginx:** `/var/log/nginx/error.log`
- **Backup:** `/opt/use-messenger/logs/backup.log`

---

## 💾 Backup

### Автоматический
Настроен автоматически при деплое:
- **Частота:** Каждый день в 3:00
- **Хранение:** 7 дней
- **Расположение:** `/opt/use-messenger/backups/`

### Ручной backup
```bash
ssh root@<SERVER_IP>
cd /opt/use-messenger

# Backup БД
cp data/use.db backups/use_$(date +%Y%m%d).db

# Backup uploads
tar -czf backups/uploads_$(date +%Y%m%d).tar.gz uploads/
```

### Восстановление
```bash
# Остановить контейнер
docker-compose stop

# Восстановить БД
cp backups/use_20260422.db data/use.db

# Восстановить uploads
tar -xzf backups/uploads_20260422.tar.gz

# Запустить контейнер
docker-compose start
```

---

## 🔄 Обновление

### Автоматическое (через Git)
```bash
ssh root@<SERVER_IP>
cd /opt/use-messenger

# Получить обновления
git pull origin main

# Пересобрать и перезапустить
docker-compose up -d --build
```

### Через GitHub Actions (опционально)
Настроить webhook для автоматического деплоя при push в main.

---

## 🐛 Устранение неполадок

### Контейнер не запускается
```bash
# Проверить логи
docker-compose logs use-messenger

# Проверить конфигурацию
docker-compose config

# Пересобрать с нуля
docker-compose down
docker-compose up -d --build
```

### WebSocket не подключается
```bash
# Проверить Nginx конфигурацию
nginx -t

# Проверить логи Nginx
tail -f /var/log/nginx/error.log

# Проверить CORS в .env
cat .env | grep ALLOWED_ORIGINS
```

### База данных пустая
```bash
# Проверить путь к БД
docker exec use-messenger ls -la /app/data/

# Проверить таблицы
docker exec use-messenger sqlite3 /app/data/use.db ".tables"

# Проверить пользователей
docker exec use-messenger sqlite3 /app/data/use.db "SELECT * FROM users;"
```

### Нехватка памяти при сборке
```bash
# Проверить память
free -h

# Создать swap (временно)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Собрать
docker-compose up -d --build

# Удалить swap
sudo swapoff /swapfile
sudo rm /swapfile
```

---

## 📞 Поддержка

### Документация
- `DEPLOY_CHECKLIST.md` - полный чеклист
- `DOCKER.md` - Docker документация
- `README.md` - основная документация
- `QUICKSTART.md` - быстрый старт

### Полезные ссылки
- **GitHub:** https://github.com/qst4cash/use-messenger
- **Текущий сервер:** 144.31.69.7 (1GB RAM - недостаточно)
- **Домен:** https://usecommunity.online

### Известные проблемы
- Текущий сервер имеет только 1GB RAM
- Docker build падает из-за нехватки памяти
- Решение: использовать сервер с 2GB+ RAM

---

## ✅ Финальный чеклист

Перед деплоем убедитесь:

- [ ] Сервер имеет минимум 2GB RAM
- [ ] SSH доступ настроен
- [ ] DNS указывает на сервер
- [ ] Домен доступен
- [ ] Порты 80, 443 открыты
- [ ] Выбран способ деплоя (1, 2 или 3)
- [ ] Скрипты имеют права на выполнение (chmod +x)

После деплоя проверьте:

- [ ] Сайт открывается: https://usecommunity.online
- [ ] API работает: https://usecommunity.online/api/users
- [ ] SSL сертификат валиден (зеленый замок)
- [ ] Регистрация работает
- [ ] Вход работает
- [ ] Отправка сообщений работает
- [ ] WebSocket подключается
- [ ] Загрузка файлов работает

---

## 🎉 Готово!

Проект **полностью готов** к production деплою.

**Выберите вариант деплоя и запускайте!**

```bash
# Вариант 1: Новый сервер
./deploy/full-deploy.sh <SERVER_IP> <DOMAIN>

# Вариант 2: Миграция
./deploy/migrate.sh 144.31.69.7 <NEW_SERVER_IP> <DOMAIN>

# Вариант 3: Локальная сборка
# См. инструкции выше
```

**Время деплоя:** 15-25 минут  
**Сложность:** Низкая (автоматизировано)  
**Результат:** Production-ready мессенджер с SSL, backup и мониторингом

---

**Создано:** 2026-04-22  
**Версия:** 1.0.0  
**Статус:** Production Ready ✅
