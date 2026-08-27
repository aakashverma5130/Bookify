# Bookify — Production Deployment Guide

## Overview
This guide covers deploying Bookify (React + Node.js + Python FastAPI + PostgreSQL) to a production environment with full functionality for all three user roles.

---

## 1. Infrastructure Requirements

### Minimum Production Specs
| Component | Specification |
|-----------|---------------|
| **Server** | 2 vCPU, 4 GB RAM (minimum), 20 GB SSD |
| **OS** | Ubuntu 22.04 LTS / Debian 12 |
| **Database** | PostgreSQL 15+ (managed service recommended: AWS RDS, Neon, Supabase) |
| **Reverse Proxy** | Nginx + Certbot (Let's Encrypt SSL) |
| **Process Manager** | PM2 (Node), systemd (Python) |
| **Domain** | `Bookify.youruniversity.edu` (or similar) |

### Recommended Production Architecture
```
Internet → [Cloudflare/WAF] → Nginx (SSL termination)
                              ├── frontend (static files)
                              ├── backend (api.Bookify.edu) → PostgreSQL
                              └── ai-service (ai.Bookify.edu) → PostgreSQL (read-only)
```

---

## 2. Pre-Deployment Checklist

### 2.1 Environment Variables (Production)

#### Backend (`backend/.env.production`)
```bash
NODE_ENV=production
PORT=5000

# PostgreSQL (managed service)
DATABASE_URL=postgresql://user:strong_password@db-host:5432/Bookify

# JWT - Generate with: openssl rand -base64 64
JWT_SECRET=your-256-bit-base64-secret-here
JWT_EXPIRES_IN=7d

# Email (SMTP - required for OTP/reminders)
SMTP_HOST=smtp.youruniversity.edu
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@youruniversity.edu
SMTP_PASS=your-smtp-password
EMAIL_FROM="Bookify Library <noreply@youruniversity.edu>"

# CORS - Your frontend domain
CORS_ORIGINS=https://Bookify.youruniversity.edu

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=200
AUTH_RATE_LIMIT_MAX=5

# File Uploads
UPLOAD_DIR=/var/www/Bookify/uploads
MAX_FILE_SIZE_MB=50

# AI Service (internal network)
AI_SERVICE_URL=http://ai-service:8000
AI_SERVICE_TIMEOUT_MS=10000

# Web Push (generate with: npm run generate-vapid)
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:admin@youruniversity.edu

# Cron Jobs
REMINDER_CRON=0 8 * * *
```

#### AI Service (`ai-service/.env.production`)
```bash
# Read-only PostgreSQL connection
DATABASE_URL=postgresql://readonly_user:password@db-host:5432/Bookify

# CORS - Only backend should call this
ALLOWED_ORIGINS=http://backend:5000,https://api.Bookify.youruniversity.edu

# Model cache persistence
HF_HOME=/var/cache/huggingface
```

#### Frontend (Build-time)
```bash
# frontend/.env.production
VITE_API_URL=https://api.Bookify.youruniversity.edu/api
```

---

## 3. Database Setup (Production)

### 3.1 Create Production Database
```sql
-- Run as postgres superuser
CREATE DATABASE Bookify;
CREATE USER Bookify_app WITH ENCRYPTED PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE Bookify TO Bookify_app;

-- Read-only user for AI service
CREATE USER Bookify_ai_readonly WITH ENCRYPTED PASSWORD 'ai_readonly_password';
GRANT CONNECT ON DATABASE Bookify TO Bookify_ai_readonly;
\c Bookify
GRANT USAGE ON SCHEMA public TO Bookify_ai_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO Bookify_ai_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO Bookify_ai_readonly;
```

### 3.2 Run Migrations
```bash
# On server with psql access
psql -U Bookify_app -d Bookify -h db-host -f database/schema.sql
psql -U Bookify_app -d Bookify -h db-host -f database/seed.sql
```

### 3.3 Verify Critical Tables
```sql
-- Check seed data loaded
SELECT count(*) FROM users;
SELECT count(*) FROM books;
SELECT count(*) FROM book_copies;
SELECT count(*) FROM students;
SELECT count(*) FROM librarians;
```

---

## 4. Backend Deployment (Node.js + Express)

### 4.1 Server Setup
```bash
# On production server
sudo apt update && sudo apt install -y nodejs npm nginx certbot python3-certbot-nginx

# Create app user
sudo useradd -m -s /bin/bash Bookify
sudo mkdir -p /var/www/Bookify
sudo chown Bookify:Bookify /var/www/Bookify
```

### 4.2 Deploy Backend Code
```bash
# As Bookify user
cd /var/www/Bookify
git clone <your-repo> backend
cd backend
npm ci --production

# Copy production env
cp .env.example .env.production
# Edit .env.production with actual values
```

### 4.3 PM2 Configuration (`ecosystem.config.js`)
```javascript
module.exports = {
  apps: [{
    name: 'Bookify-backend',
    script: 'server.js',
    cwd: '/var/www/Bookify/backend',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    instances: 'max',
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    error_file: '/var/log/Bookify/backend-error.log',
    out_file: '/var/log/Bookify/backend-out.log',
    log_file: '/var/log/Bookify/backend-combined.log',
    time: true
  }]
};
```

### 4.4 Start Backend
```bash
sudo mkdir -p /var/log/Bookify
sudo chown Bookify:Bookify /var/log/Bookify
sudo -u Bookify pm2 start ecosystem.config.js --env production
sudo -u Bookify pm2 save
sudo -u Bookify pm2 startup
```

---

## 5. AI Service Deployment (Python + FastAPI)

### 5.1 Server Setup
```bash
sudo apt install -y python3.11 python3.11-venv python3-pip
```

### 5.2 Deploy AI Service
```bash
cd /var/www/Bookify
git clone <your-repo> ai-service
cd ai-service
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Copy production env
cp .env.example .env.production
# Edit .env.production
```

### 5.3 Systemd Service (`/etc/systemd/system/Bookify-ai.service`)
```ini
[Unit]
Description=Bookify AI Service
After=network.target

[Service]
Type=simple
User=Bookify
WorkingDirectory=/var/www/Bookify/ai-service
Environment=PATH=/var/www/Bookify/ai-service/venv/bin
EnvironmentFile=/var/www/Bookify/ai-service/.env.production
ExecStart=/var/www/Bookify/ai-service/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2
Restart=on-failure
RestartSec=10
StandardOutput=append:/var/log/Bookify/ai-service.log
StandardError=append:/var/log/Bookify/ai-service-error.log

[Install]
WantedBy=multi-user.target
```

### 5.4 Start AI Service
```bash
sudo systemctl daemon-reload
sudo systemctl enable Bookify-ai
sudo systemctl start Bookify-ai
sudo systemctl status Bookify-ai
```

---

## 6. Frontend Deployment (React + Vite)

### 6.1 Build Production Bundle
```bash
cd /var/www/Bookify
git clone <your-repo> frontend
cd frontend
npm ci
echo "VITE_API_URL=https://api.Bookify.youruniversity.edu/api" > .env.production
npm run build
# Output in frontend/dist/
```

### 6.2 Nginx Configuration (`/etc/nginx/sites-available/Bookify`)
```nginx
# Frontend
server {
    listen 80;
    server_name Bookify.youruniversity.edu;
    root /var/www/Bookify/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static assets caching
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
}

# Backend API
server {
    listen 80;
    server_name api.Bookify.youruniversity.edu;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }
}

# AI Service
server {
    listen 80;
    server_name ai.Bookify.youruniversity.edu;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 30s;
    }
}
```

### 6.3 Enable Sites & SSL
```bash
sudo ln -s /etc/nginx/sites-available/Bookify /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# SSL with Certbot
sudo certbot --nginx -d Bookify.youruniversity.edu -d api.Bookify.youruniversity.edu -d ai.Bookify.youruniversity.edu
```

---

## 7. Post-Deployment Verification

### 7.1 Health Checks
```bash
# Backend
curl https://api.Bookify.youruniversity.edu/health

# AI Service
curl https://ai.Bookify.youruniversity.edu/health

# Frontend
curl -I https://Bookify.youruniversity.edu
```

### 7.2 Functional Tests
| Test | Expected Result |
|------|-----------------|
| Student login | Redirects to `/student/home` |
| Librarian login | Redirects to `/lib/dashboard` |
| Book search | Returns results |
| Reserve book | Creates reservation |
| Issue book | Updates copy status |
| AI search | Returns semantic results |
| Recommendations | Returns personalized books |
| Forecast | Returns demand predictions |
| Email OTP | Sends to test email |
| Web push | Subscribes & receives |

---

## 8. Monitoring & Maintenance

### 8.1 Log Rotation (`/etc/logrotate.d/Bookify`)
```
/var/log/Bookify/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 Bookify Bookify
    sharedscripts
    postrotate
        systemctl reload Bookify-ai > /dev/null 2>&1 || true
        pm2 reloadLogs > /dev/null 2>&1 || true
    endscript
}
```

### 8.2 Backup Strategy
```bash
# Daily PostgreSQL backup (cron)
0 2 * * * pg_dump -U Bookify_app -h db-host Bookify | gzip > /backups/Bookify_$(date +\%F).sql.gz

# Weekly full server backup
```

### 8.3 Updates
```bash
# Backend
cd /var/www/Bookify/backend
git pull
npm ci --production
pm2 reload Bookify-backend

# AI Service
cd /var/www/Bookify/ai-service
git pull
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart Bookify-ai

# Frontend
cd /var/www/Bookify/frontend
git pull
npm ci
npm run build
sudo systemctl reload nginx
```

---

## 9. Security Hardening

- [ ] Enable PostgreSQL SSL (`sslmode=require`)
- [ ] Restrict database access to application servers only
- [ ] Set up WAF (Cloudflare/AWS WAF)
- [ ] Enable rate limiting on all auth endpoints
- [ ] Configure CSP headers in Nginx
- [ ] Set up fail2ban for SSH
- [ ] Regular security updates (`apt upgrade`)
- [ ] Rotate JWT_SECRET annually
- [ ] Audit dependencies (`npm audit`, `pip-audit`)

---

## 10. Rollback Plan

```bash
# Backend rollback
pm2 stop Bookify-backend
git checkout <previous-tag>
npm ci --production
pm2 start Bookify-backend

# Frontend rollback
git checkout <previous-tag>
npm ci && npm run build
sudo systemctl reload nginx

# Database rollback (if migration applied)
psql -U Bookify_app -d Bookify -f database/migrations/rollback_<version>.sql
```

---

## Appendix: Useful Commands

```bash
# View logs
pm2 logs Bookify-backend
journalctl -u Bookify-ai -f
tail -f /var/log/nginx/access.log

# Check processes
pm2 list
systemctl status Bookify-ai
nginx -t

# Database console
psql -U Bookify_app -d Bookify -h db-host

# Test AI service
curl -X POST https://ai.Bookify.youruniversity.edu/ai/search \
  -H "Content-Type: application/json" \
  -d '{"query": "machine learning", "limit": 5}'
```