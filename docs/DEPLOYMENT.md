# 🚀 Deployment Guide - Rezerwacje Sal

## Spis Treści

1. [Wymagania](#wymagania)
2. [Deployment Lokalny](#deployment-lokalny)
3. [Deployment Staging](#deployment-staging)
4. [Deployment Produkcji](#deployment-produkcji)
5. [Monitoring & Logowanie](#monitoring--logowanie)
6. [Troubleshooting](#troubleshooting)

---

## Wymagania

### System Requirements
- **OS**: Linux (Ubuntu 20.04+) lub macOS
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **RAM**: Min 2GB (dev), 4GB+ (production)
- **Storage**: 20GB+

### Software Requirements
- Node.js 18+ (opcjonalnie dla lokalnego developmentu)
- PostgreSQL 14+ (opcjonalnie, wbudowany w Docker)
- Redis 7+ (opcjonalnie, wbudowany w Docker)

---

## Deployment Lokalny

### 1. Setup

```bash
# 1. Klonowanie repozytorium
git clone https://github.com/kamil-gol/rezerwacje.git
cd rezerwacje

# 2. Konfiguracja zmiennych środowiskowych
cp .env.example .env.local

# 3. Edycja .env.local
vim .env.local
```

### 2. Docker Compose Up

```bash
# Build images
docker-compose build

# Uruchomienie wszystkich serwisów
docker-compose up -d

# Sprawdzenie statusów
docker-compose ps
```

**Output powinien być**:
```
CONTAINER ID   NAME                COMMAND                  STATUS
...            rezerwacje-db       "docker-entrypoint..."   Up (healthy)
...            rezerwacje-cache    "redis-server ..."       Up (healthy)
...            rezerwacje-api      "npm run dev"            Up
...            rezerwacje-web      "npm run dev"            Up
```

### 3. Database Setup

```bash
# Migracja bazy danych
docker-compose exec backend npm run prisma:migrate:dev

# Seed testowymi danymi
docker-compose exec backend npm run seed

# Sprawdzenie bazy
docker-compose exec backend npm run prisma:studio
```

### 4. Weryfikacja

```bash
# Frontend
http://localhost:3000

# Backend API
http://localhost:3001/api/health

# Swagger API Docs
http://localhost:3001/api/docs

# Database (PG Admin - opcjonalnie)
http://localhost:5050
```

### 5. Uruchamianie Testów

```bash
# Unit testy
docker-compose exec backend npm run test
docker-compose exec frontend npm run test

# Integration testy
docker-compose exec backend npm run test:integration

# E2E testy
docker-compose exec frontend npm run test:e2e

# Coverage report
npm run test:coverage
```

---

## Deployment Staging

### 1. Przygotowanie

```bash
# 1. Tagi dla imageów
docker tag rezerwacje-backend:latest kamil-gol/rezerwacje-backend:staging
docker tag rezerwacje-frontend:latest kamil-gol/rezerwacje-frontend:staging

# 2. Push do Docker Registry
docker push kamil-gol/rezerwacje-backend:staging
docker push kamil-gol/rezerwacje-frontend:staging
```

### 2. Server Configuration

**Na serwerze staging**:

```bash
# SSH do servera
ssh user@staging-server.com

# Clone repo
git clone https://github.com/kamil-gol/rezerwacje.git
cd rezerwacje

# Checkout staging branch
git checkout staging

# Konfiguracja
cp .env.example .env.staging
vim .env.staging  # Ustaw production values
```

### 3. Docker Compose Staging

**docker-compose.staging.yml**:

```yaml
version: '3.8'

services:
  backend:
    image: kamil-gol/rezerwacje-backend:staging
    environment:
      NODE_ENV: staging
      DATABASE_URL: postgresql://...
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy

  frontend:
    image: kamil-gol/rezerwacje-frontend:staging
    environment:
      NEXT_PUBLIC_API_URL: https://api-staging.gosciniecrodzinny.pl/api
    ports:
      - "3000:3000"

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: rezerwacje
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_staging:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U rezerwacje']
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_staging:
```

### 4. Deployment

```bash
# Pull latest images
docker-compose -f docker-compose.staging.yml pull

# Stop current
docker-compose -f docker-compose.staging.yml down

# Start new
docker-compose -f docker-compose.staging.yml up -d

# Migrations
docker-compose -f docker-compose.staging.yml exec backend npm run prisma:migrate:deploy

# Healthcheck
docker-compose -f docker-compose.staging.yml ps
```

### 5. Smoke Tests

```bash
# Test API
curl https://staging.gosciniecrodzinny.pl/api/health

# Test Frontend
curl -I https://staging.gosciniecrodzinny.pl

# Test Database
docker-compose -f docker-compose.staging.yml exec backend npm run db:check
```

---

## Deployment Produkcji

### 1. Pre-Deployment Checklist

- [ ] Wszystkie testy przechodzą
- [ ] Code review completed
- [ ] Backup bazy przed deploymentem
- [ ] Monitoring setup
- [ ] SSL certificates valida
- [ ] Database migrations tested
- [ ] Rollback plan przygotowany
- [ ] Team notified

### 2. Production Environment

**Rekomendowana architektura**:

```
Domain (gosciniecrodzinny.pl)
        │
        │ HTTPS/Port 443
        ▼
   Nginx Reverse Proxy
        │
    ┌─┼─┐
    │     │
    ▼     ▼
  Backend  Frontend
  :3001    :3000
    │     │
    └─┼─┘
        │
        ▼
   PostgreSQL
   (Primary + Replica)
```

### 3. Production Configuration

**.env.production**:

```env
# NODE
NODE_ENV=production

# DATABASE
DB_USER=rezerwacje_prod
DB_PASSWORD=<STRONG_PASSWORD_32_CHARS>
DB_NAME=rezerwacje_prod
DATABASE_URL=postgresql://...

# API
API_PORT=3001
JWT_SECRET=<RANDOM_SECRET_64_CHARS>
LOG_LEVEL=warn

# FRONTEND
WEB_PORT=3000
NEXT_PUBLIC_API_URL=https://api.gosciniecrodzinny.pl/api

# SMTP
SMTP_HOST=mail.gosciniecrodzinny.pl
SMTP_PORT=587
SMTP_USER=noreply@gosciniecrodzinny.pl
SMTP_PASS=<EMAIL_PASSWORD>

# BACKUP
BACKUP_DIR=/mnt/backups
BACKUP_RETENTION_DAYS=90

# SECURITY
SESSION_SECRET=<RANDOM_SESSION_SECRET_64_CHARS>

# REDIS
REDIS_URL=redis://redis:6379
```

### 4. SSL/HTTPS Setup

```bash
# Zainstaluj Certbot
sudo apt-get install certbot python3-certbot-nginx

# Wygeneruj certyfikat Let's Encrypt
sudo certbot certonly --standalone -d gosciniecrodzinny.pl -d api.gosciniecrodzinny.pl

# Odnowienie (auto)
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### 5. Nginx Configuration

**/etc/nginx/sites-available/rezerwacje**:

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name gosciniecrodzinny.pl api.gosciniecrodzinny.pl;
    return 301 https://$server_name$request_uri;
}

# Main HTTPS server
server {
    listen 443 ssl http2;
    server_name gosciniecrodzinny.pl;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/gosciniecrodzinny.pl/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gosciniecrodzinny.pl/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# API subdomain
server {
    listen 443 ssl http2;
    server_name api.gosciniecrodzinny.pl;

    ssl_certificate /etc/letsencrypt/live/gosciniecrodzinny.pl/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gosciniecrodzinny.pl/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Access-Control-Allow-Origin "https://gosciniecrodzinny.pl" always;

    # Backend
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/rezerwacje /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Reload
sudo systemctl reload nginx
```

### 6. Docker Production Deployment

```bash
# SSH do production servera
ssh user@production-server.com

# Clone repo
git clone https://github.com/kamil-gol/rezerwacje.git
cd rezerwacje

# Checkout main
git checkout main

# Pull latest
git pull origin main

# Load environment
cp .env.example .env.production
vim .env.production

# Build & push images
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml push

# Database backup BEFORE deployment!
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U rezerwacje rezerwacje > backup_$(date +%Y%m%d_%H%M%S).sql

# Deploy
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d

# Migrations
docker-compose -f docker-compose.prod.yml exec backend npm run prisma:migrate:deploy

# Verify
docker-compose -f docker-compose.prod.yml ps
curl https://api.gosciniecrodzinny.pl/api/health
```

### 7. Zero-Downtime Deployment (Blue-Green)

```bash
# Setup two environments: blue (current), green (new)

# 1. Deploy to green
docker-compose -f docker-compose.prod.green.yml up -d

# 2. Test green
curl http://localhost:3001-green/api/health

# 3. Switch Nginx to green
sudo vim /etc/nginx/sites-available/rezerwacje
# Change proxy_pass to :3001-green
sudo systemctl reload nginx

# 4. Monitor
watch docker-compose -f docker-compose.prod.green.yml ps

# 5. Rollback if needed (switch back to blue)
sudo vim /etc/nginx/sites-available/rezerwacje
sudo systemctl reload nginx
```

---

## Monitoring & Logowanie

### Log Locations

```bash
# Backend logs
docker-compose logs -f backend

# Frontend logs
docker-compose logs -f frontend

# Database logs
docker-compose logs -f postgres

# All
docker-compose logs -f
```

### Health Checks

```bash
# API Health
curl https://api.gosciniecrodzinny.pl/api/health

# Response:
# {
#   "status": "ok",
#   "database": "connected",
#   "redis": "connected",
#   "uptime": 3600
# }
```

### Monitoring Stack (Optional)

```bash
# Install Prometheus & Grafana
docker run -d -p 9090:9090 prom/prometheus
docker run -d -p 3000:3000 grafana/grafana

# Metrics endpoints
# Backend: http://localhost:3001/metrics
# Grafana: http://localhost:3000
```

---

## Troubleshooting

### Container Issues

```bash
# Wyczyść wszystko
docker-compose down -v
docker system prune -a

# Rebuild
docker-compose build --no-cache

# Restart
docker-compose up -d
```

### Database Connection Error

```bash
# Sprawdzenie statusu
docker-compose ps postgres

# Logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres

# Wait for healthy
sleep 30

# Reconnect backend
docker-compose restart backend
```

### Out of Memory

```bash
# Check usage
docker stats

# Cleanup unused
docker system prune

# Increase Docker memory (Mac/Windows)
# Docker Desktop > Preferences > Resources > Memory: 4GB+
```

### SSL Certificate Issues

```bash
# Check certificate
sudo openssl x509 -in /etc/letsencrypt/live/gosciniecrodzinny.pl/fullchain.pem -text -noout

# Renew certificate
sudo certbot renew --force-renewal

# Reload Nginx
sudo systemctl reload nginx
```

### Backup & Recovery

```bash
# Create backup
docker-compose exec postgres pg_dump -U rezerwacje rezerwacje > backup.sql

# Restore backup
cat backup.sql | docker-compose exec -T postgres psql -U rezerwacje rezerwacje

# Verify restore
docker-compose exec postgres psql -U rezerwacje -d rezerwacje -c "SELECT COUNT(*) FROM reservations;"
```

### Performance Issues

```bash
# Check database queries
docker-compose exec postgres psql -U rezerwacje -d rezerwacje -c "\dt+"

# Check indexes
docker-compose exec postgres psql -U rezerwacje -d rezerwacje -c "\di"

# Analyze slow queries
docker-compose exec backend npm run db:analyze
```

---

## Maintenance

### Regular Tasks

**Daily**:
- [ ] Monitor application logs
- [ ] Check disk space
- [ ] Verify backups

**Weekly**:
- [ ] Review security logs
- [ ] Check certificate expiration
- [ ] Update Docker images

**Monthly**:
- [ ] Database optimization
- [ ] Performance review
- [ ] Security audit

### Update Procedure

```bash
# 1. Pull latest code
git pull origin main

# 2. Update .env if needed
vim .env.production

# 3. Rebuild images
docker-compose -f docker-compose.prod.yml build

# 4. Backup database
# ... (see above)

# 5. Deploy
docker-compose -f docker-compose.prod.yml up -d

# 6. Migrate database
docker-compose -f docker-compose.prod.yml exec backend npm run prisma:migrate:deploy

# 7. Verify
curl https://api.gosciniecrodzinny.pl/api/health
```

---

## Rollback Plan

```bash
# If something goes wrong:

# 1. Switch Nginx back to previous version
sudo vim /etc/nginx/sites-available/rezerwacje
# Change proxy_pass back
sudo systemctl reload nginx

# 2. Restore database from backup
cat backup.sql | docker-compose exec -T postgres psql -U rezerwacje rezerwacje

# 3. Restart containers
docker-compose restart

# 4. Verify
curl https://gosciniecrodzinny.pl
```

---

## Support & Escalation

**For issues contact**:
- Slack: #rezerwacje-deployment
- Email: devops@gosciniecrodzinny.pl
- On-call: Check escalation list

---

**Last Updated**: 06.02.2026