# Multi-stage build для оптимизации размера

# Stage 1: Build backend
FROM golang:1.26-alpine AS backend-builder

# Установка gcc для CGO (SQLite требует CGO)
RUN apk add --no-cache gcc musl-dev sqlite-dev

WORKDIR /app/backend

# Копирование go.mod и go.sum для кеширования зависимостей
COPY backend/go.mod backend/go.sum ./
RUN go mod download

# Копирование исходников backend
COPY backend/ ./

# Сборка backend (без -a для экономии памяти)
RUN CGO_ENABLED=1 GOOS=linux go build -ldflags="-s -w" -o use-server .

# Stage 2: Build frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Копирование package.json для кеширования зависимостей
COPY clients/web/package*.json ./
RUN npm ci

# Копирование исходников frontend
COPY clients/web/ ./

# Сборка frontend
RUN npm run build

# Stage 3: Final image
FROM alpine:latest

# Установка необходимых пакетов
RUN apk --no-cache add ca-certificates sqlite

WORKDIR /app

# Копирование backend из builder
COPY --from=backend-builder /app/backend/use-server .

# Копирование frontend из builder
COPY --from=frontend-builder /app/frontend/dist ./static

# Создание директорий
RUN mkdir -p uploads/avatars uploads/files/image uploads/files/video uploads/files/audio

# Открытие порта
EXPOSE 4000

# Запуск
CMD ["./use-server"]
