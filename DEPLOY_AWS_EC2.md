# 🚀 Complete All-in-One Docker Deployment for TradeGuard AI

This setup runs **PostgreSQL**, **Python Regime AI Microservice**, and **Next.js Fullstack Web App** in Docker containers automatically.

---

## ⚡ 1-Command Local or EC2 Run:

### Step 1: Run All Containers (Postgres + Python AI + Next.js)
```bash
docker compose up -d --build
```

### Step 2: Database Tables Sync (1 Time Only)
```bash
docker compose exec web npx prisma@5.16.1 db push
```

### Step 3: Verify Running Status
```bash
docker ps
```
Aapko 3 containers active dikhenge:
1. `tradeguard-db` (PostgreSQL Database on port 5432)
2. `tradeguard-regime` (Python HMM AI Service on port 8000)
3. `tradeguard-web` (Next.js Application on port 3000)

---

## 🌐 Production Nginx Setup (EC2 Public Access)

EC2 server par Nginx configure karein taaki port 80/443 se web traffic port 3000 par pass ho:

```bash
sudo nano /etc/nginx/sites-available/tradeguard
```

Paste:
```nginx
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and Restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/tradeguard /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo systemctl restart nginx
```
