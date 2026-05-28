# e-Tunisia Production Deployment Checklist

**Last Updated:** 2026-05-28  
**Status:** Ready for Deployment  
**Estimated Setup Time:** 2-4 hours

---

## PART 1: PRE-DEPLOYMENT SECURITY AUDIT ✅

### Authentication & Authorization
- [x] JWT token expiry set (`JWT_EXPIRES_IN=7d`)
- [x] Password reset flow implemented
- [x] Google OAuth login implemented
- [x] Role-based access control (`user`, `creator`, `admin`, `superadmin`)
- [x] Route guards on frontend for protected pages
- [x] **Token invalidation on password change** — `tokenVersion` in JWT payload, incremented on reset
- [ ] **ACTION:** Change default `JWT_SECRET` to a cryptographically secure 256-bit key

### Rate Limiting
- [x] Global rate limit: 100 req/min via `CustomThrottlerGuard` (APP_GUARD)
- [x] Auth endpoints: 5-10 req/min
- [x] Upload endpoints: 10 req/min
- [x] Password reset: 3 req/min
- [x] WebSocket message rate limiting: 20 msgs per 10s per user

### Security Headers (Helmet)
- [x] Content-Security-Policy configured
- [x] HSTS enabled (1 year, includeSubDomains, preload)
- [x] X-Frame-Options via Helmet
- [x] X-Content-Type-Options via Helmet
- [x] Response compression enabled
- [ ] **ACTION:** Review CSP directives if adding new external scripts/CDNs

### CORS
- [x] CORS configured with origin validation
- [x] WebSocket CORS uses same origin patterns as HTTP
- [x] Credentials enabled for cookies/auth
- [ ] **ACTION:** Replace wildcard origins in production:
  ```env
  ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
  ```

### Input Validation
- [x] Global ValidationPipe with `whitelist: true`
- [x] DTOs for all endpoints
- [x] File upload type validation (images + video whitelist)
- [x] File upload size limit: 50MB
- [x] XSS escaping in frontend (`esc()`, `escHtml()`)
- [x] **Critical XSS paths fixed** — feed rendering, mention dropdown, photo preview
- [ ] **ACTION:** Review remaining ~110 `innerHTML` usages for sanitization gaps

### Logging & Observability
- [x] Request ID middleware — `X-Request-ID` header propagation
- [x] Log URL sanitization — tokens/passwords redacted
- [x] Structured error responses include `requestId`
- [x] Exception filter captures stack traces without leaking internals

---

## PART 2: INFRASTRUCTURE REQUIREMENTS

### Minimum Server Specs
| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 2 cores | 4 cores |
| RAM | 4 GB | 8 GB |
| Disk | 20 GB SSD | 50 GB SSD |
| OS | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |

### Required Services
| Service | Version | Purpose |
|---------|---------|---------|
| Node.js | 20+ | Runtime |
| PostgreSQL | 15+ | Primary database |
| Redis | 7+ | Cache, sessions, queues |
| MinIO | Latest | S3-compatible file storage |
| Meilisearch | 1.8+ | Full-text search engine |
| Nginx | 1.24+ | Reverse proxy + static files |
| PM2 | Latest | Process management |

### Ports
| Port | Service | Public? |
|------|---------|---------|
| 80 | Nginx (HTTP) | Yes |
| 443 | Nginx (HTTPS) | Yes |
| 3000 | NestJS API | No (Nginx proxy) |
| 5173 | Vite dev | No |
| 7700 | Meilisearch | No (localhost only) |
| 6379 | Redis | No (localhost only) |
| 9000 | MinIO | No (localhost only) |

---

## PART 3: ENVIRONMENT VARIABLES

### Backend `.env` (Production)
```env
# ===== SERVER =====
NODE_ENV=production
PORT=3000
ALLOWED_ORIGINS=https://yourdomain.com

# ===== DATABASE (PostgreSQL) =====
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=etunisia_prod
DB_PASSWORD=<STRONG_PASSWORD>
DB_NAME=etunisia_prod
DB_POOL_MAX=20
DB_POOL_MIN=5

# ===== REDIS =====
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=<STRONG_PASSWORD>

# ===== JWT =====
JWT_SECRET=<256_BIT_HEX_SECRET>
JWT_EXPIRES_IN=7d

# ===== S3 / MINIO =====
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY=<MINIO_ACCESS_KEY>
S3_SECRET_KEY=<MINIO_SECRET_KEY>
S3_BUCKET=etunisia
S3_FORCE_PATH_STYLE=true
S3_PUBLIC_URL=https://cdn.yourdomain.com

# ===== STRIPE =====
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_BILLING_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PREMIUM_MONTHLY=price_...
STRIPE_PRICE_PREMIUM_YEARLY=price_...

# ===== GOOGLE OAUTH =====
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# ===== WEB PUSH =====
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:support@yourdomain.com

# ===== MEILISEARCH =====
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_API_KEY=your-master-key

# ===== EMAIL (Resend) =====
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@yourdomain.com

# ===== SWAGGER (Production) =====
# SWAGGER_ENABLED=true
# SWAGPER_SECRET=your-secret-key
```

### Frontend `.env` (Production)
```env
VITE_API_URL=https://yourdomain.com
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key
```

---

## PART 4: STEP-BY-STEP DEPLOYMENT

### Step 1: Server Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Redis
sudo apt install -y redis-server

# Install Meilisearch
curl -L https://install.meilisearch.com | sh
sudo mv meilisearch /usr/local/bin/
```

### Step 2: Database Setup
```bash
# Create database and user
sudo -u postgres psql -c "CREATE USER etunisia_prod WITH PASSWORD 'STRONG_PASSWORD';"
sudo -u postgres psql -c "CREATE DATABASE etunisia_prod OWNER etunisia_prod;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE etunisia_prod TO etunisia_prod;"

# Set Redis password
sudo nano /etc/redis/redis.conf
# Add: requirepass STRONG_PASSWORD
sudo systemctl restart redis
```

### Step 3: MinIO Setup
```bash
# Download and run MinIO
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
sudo mv minio /usr/local/bin/

# Create systemd service
sudo mkdir -p /mnt/minio-data
sudo useradd -r -s /sbin/nologin minio-user
sudo chown -R minio-user:minio-user /mnt/minio-data

# Create bucket
export MINIO_ROOT_USER=admin
export MINIO_ROOT_PASSWORD=STRONG_PASSWORD
minio server /mnt/minio-data --console-address :9001 &

# Create etunisia bucket and set public-read policy
mc alias set local http://localhost:9000 admin STRONG_PASSWORD
mc mb local/etunisia
mc anonymous set download local/etunisia
```

### Step 4: Meilisearch Setup
```bash
# Run Meilisearch with master key
meilisearch --master-key "YOUR_MASTER_KEY" &

# Index existing content (run after first backend start)
curl -X POST 'http://localhost:7700/indexes/places/documents' \
  -H 'Authorization: Bearer YOUR_MASTER_KEY'
```

### Step 5: Backend Deployment
```bash
# Clone repo
git clone <your-repo> /var/www/e-tunisia
cd /var/www/e-tunisia/backend

# Install dependencies
npm ci --production

# Copy env
cp .env.example .env
nano .env  # Fill in all production values

# Run database migrations
npm run migration:run

# Build
npm run build

# Start with PM2
pm2 start dist/main.js --name "etunisia-api" --instances max
pm2 save
pm2 startup
```

### Step 6: Frontend Build
```bash
cd /var/www/e-tunisia/web

# Install dependencies
npm ci

# Copy env
cp .env .env.local
nano .env.local

# Build
npm run build

# Copy dist to Nginx web root
sudo cp -r dist/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html
```

### Step 7: Nginx Configuration
```nginx
# /etc/nginx/sites-available/e-tunisia
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Frontend static files
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # WebSocket proxy
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400;
    }

    # Uploads proxy to MinIO
    location /uploads/ {
        proxy_pass http://localhost:9000/etunisia/;
        proxy_set_header Host $host;
        proxy_buffering off;
        client_max_body_size 50M;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/e-tunisia /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 8: SSL Certificate (Let's Encrypt)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo certbot renew --dry-run
```

---

## PART 5: POST-DEPLOYMENT VERIFICATION

### Critical Path Tests
- [ ] Homepage loads (`https://yourdomain.com`)
- [ ] API health check (`GET /api/v1/health`)
- [ ] Database health (`GET /api/v1/health/db`)
- [ ] Redis health (`GET /api/v1/health/redis`)
- [ ] Queue health (`GET /api/v1/health/queues`)
- [ ] Google OAuth login works
- [ ] Email/password login works
- [ ] Password reset flow works (email sent via queue)
- [ ] Post creation with image works (image optimization queued)
- [ ] Post creation with video works
- [ ] Reels page loads and plays videos
- [ ] Map page shows places + travelers
- [ ] Search returns results (Meilisearch or DB fallback)
- [ ] Push notifications subscribe successfully
- [ ] PWA installs correctly
- [ ] Stripe checkout works (test mode)

### Load Testing
```bash
# Install k6
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt update
sudo apt install k6

# Run load test
k6 run --vus 100 --duration 30s - <<EOF
import http from 'k6/http';
export default function () {
  http.get('https://yourdomain.com/api/v1/health');
}
EOF
```

---

## PART 6: MONITORING & MAINTENANCE

### PM2 Monitoring
```bash
pm2 monit
pm2 logs etunisia-api
pm2 reload etunisia-api  # Zero-downtime restart
```

### Database Backups
```bash
# Add to crontab
0 2 * * * pg_dump -U etunisia_prod etunisia_prod | gzip > /backups/etunisia_$(date +\%Y\%m\%d).sql.gz
```

### Log Rotation
```bash
# PM2 log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 100M
pm2 set pm2-logrotate:retain 10
```

### Database Migrations
```bash
# Generate migration after entity changes
npm run migration:generate -- src/database/migrations/Description

# Run pending migrations
npm run migration:run

# Check status
npm run migration:show
```

### Uptime Monitoring (Recommended)
- UptimeRobot: Free tier monitors every 5 minutes
- Pingdom: Paid, more features
- Better Uptime: Free, beautiful status pages

### Key Metrics to Watch
| Metric | Alert Threshold |
|--------|----------------|
| API response time | > 500ms p95 |
| Error rate | > 1% |
| CPU usage | > 80% |
| Memory usage | > 85% |
| Disk usage | > 80% |
| PostgreSQL connections | > 80% of max |
| Redis memory | > 1GB |
| Queue failed jobs | > 100 per queue |

---

## PART 7: KNOWN ISSUES & LIMITATIONS

### Current Limitations
1. **No CDN** — Images served directly from MinIO. Add CloudFront/Cloudflare for global delivery.
2. **No content moderation AI** — Manual admin moderation only. Consider AWS Comprehend.
3. **Hash-based routing** — SEO impact. Migrate to Browser History API in future.

### Security Debt
1. **~110 innerHTML usages remain** — Critical paths fixed (feed, mentions, previews). Full audit recommended.
2. **No CSRF tokens** — Relies on JWT Bearer headers (acceptable for SPA but verify).

---

## PART 8: TROUBLESHOOTING

### Common Issues

**Backend won't start:**
```bash
# Check logs
pm2 logs etunisia-api

# Common fixes
sudo systemctl start postgresql
sudo systemctl start redis
meilisearch --master-key "YOUR_KEY" &
```

**Environment validation fails:**
- Check `.env` has all required variables
- Ensure `JWT_SECRET` is >= 32 chars and not a default value
- Verify `DB_TYPE=postgres` for production

**Frontend 404 on refresh:**
- Ensure Nginx `try_files` includes `/index.html`

**CORS errors:**
- Verify `ALLOWED_ORIGINS` includes exact domain (no trailing slash)

**Upload failures:**
- Check MinIO is running: `curl http://localhost:9000/minio/health/live`
- Verify bucket exists and is public
- Check Nginx `client_max_body_size` >= 50M

**Search not working:**
- Ensure Meilisearch is running
- Run reindex: `POST /api/v1/search/reindex` (admin only)

**Queue jobs not processing:**
- Verify Redis is running and accessible
- Check `GET /health/queues` for failed job counts
- Review PM2 logs for processor errors

---

## SIGN-OFF

| Check | Status |
|-------|--------|
| Backend compiles | ✅ Pass |
| Frontend builds | ✅ Pass |
| Security headers | ✅ Implemented |
| Rate limiting | ✅ Global + per-endpoint |
| PWA enabled | ✅ Implemented |
| Queue workers | ✅ 6/6 processors active |
| Email service | ✅ Resend API + dev fallback |
| Database migrations | ✅ Infrastructure ready |
| Token invalidation | ✅ On password change |
| Request ID tracing | ✅ Middleware + logs |
| CDN | ❌ Not configured |

**Ready for production deployment with the actions above.**

---

*Generated by e-Tunisia Senior Dev Team*
