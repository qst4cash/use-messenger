#!/bin/bash
set -e

echo "🐳 Deploying USE Messenger with Docker..."

# Переход в директорию проекта
cd /opt/use-messenger

# Остановка контейнеров
echo "⏸️  Stopping containers..."
docker-compose down

# Получение изменений
echo "📥 Pulling latest changes..."
git pull origin main

# Пересборка и запуск контейнеров
echo "🔨 Building and starting containers..."
docker-compose up -d --build

# Очистка старых образов
echo "🧹 Cleaning up old images..."
docker image prune -f

# Проверка статуса
echo "✅ Checking container status..."
docker-compose ps

# Проверка логов
echo "📋 Recent logs:"
docker-compose logs --tail=20

echo ""
echo "✅ Deployment complete!"
echo "🌐 Access: http://<SERVER_IP>:4000"
echo ""
echo "Commands:"
echo "  View logs: docker-compose logs -f"
echo "  Restart: docker-compose restart"
echo "  Stop: docker-compose down"
