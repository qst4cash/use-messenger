# USE Messenger - Docker Deployment Guide

## Quick Start

### Local Development

```bash
# Build and run with Docker
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Production Deployment

See full deployment guide in the plan file or follow these steps:

1. **On Server**: Install Docker
```bash
curl -fsSL https://get.docker.com | sh
apt install -y docker-compose
```

2. **Clone Repository**
```bash
cd /opt
git clone https://github.com/<USERNAME>/use-messenger.git
cd use-messenger
```

3. **Configure Environment**
```bash
echo "JWT_SECRET=$(openssl rand -hex 32)" > .env
echo "ALLOWED_ORIGINS=http://$(curl -s ifconfig.me):4000" >> .env
```

4. **Deploy**
```bash
docker-compose up -d --build
```

5. **Setup Auto-deploy** (optional)
- Install webhook server
- Configure GitHub webhook
- See full guide in deployment plan

## Docker Commands

```bash
# View status
docker-compose ps

# View logs
docker-compose logs -f use-messenger

# Restart
docker-compose restart

# Rebuild and restart
docker-compose up -d --build

# Stop
docker-compose down

# Enter container
docker exec -it use-messenger sh

# View resource usage
docker stats use-messenger
```

## Files

- `Dockerfile` - Multi-stage build configuration
- `docker-compose.yml` - Container orchestration
- `.env.example` - Environment variables template
- `deploy/deploy.sh` - Automated deployment script

## Volumes

- `./data` - SQLite database (persistent)
- `./uploads` - User uploads (persistent)
- `./logs` - Application logs

## Ports

- `4000` - Backend API + Frontend static files

## Environment Variables

- `JWT_SECRET` - Secret key for JWT tokens
- `ALLOWED_ORIGINS` - CORS allowed origins
- `DATABASE_PATH` - Path to SQLite database
- `UPLOADS_DIR` - Path to uploads directory

## Workflow

1. Edit code locally in `C:/USE/`
2. Commit and push to GitHub
3. Server automatically pulls and rebuilds (if webhook configured)
4. Changes live in 1-2 minutes

## Troubleshooting

```bash
# Check container logs
docker-compose logs use-messenger

# Check container status
docker-compose ps

# Rebuild from scratch
docker-compose down
docker-compose up -d --build

# Check inside container
docker exec -it use-messenger sh
ls -la /app
```

## Backup

```bash
# Backup database
cp ./data/use.db ./backups/use_$(date +%Y%m%d).db

# Backup uploads
tar -czf ./backups/uploads_$(date +%Y%m%d).tar.gz ./uploads
```
