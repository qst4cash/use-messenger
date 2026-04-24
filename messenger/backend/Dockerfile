FROM golang:1.23-alpine AS builder

WORKDIR /app

# Копируем go.mod и go.sum
COPY go.mod go.sum ./

# Загружаем зависимости
RUN go mod download

# Копируем исходный код
COPY . .

# Собираем приложение
RUN go build -o main .

FROM alpine:latest

WORKDIR /app

# Устанавливаем необходимые пакеты
RUN apk --no-cache add ca-certificates

# Копируем собранное приложение
COPY --from=builder /app/main .

# Создаем директории для данных
RUN mkdir -p /app/uploads

# Открываем порт
EXPOSE 4000

# Запускаем приложение
CMD ["./main"]
