# 🚀 AWS EC2 Deployment Guide for TradeGuard AI

Complete step-by-step instructions to deploy TradeGuard AI (Next.js + Python Regime Service + Nginx + SSL) on an AWS EC2 instance.

---

## 📋 Table of Contents
1. [Launch AWS EC2 Instance](#1-launch-aws-ec2-instance)
2. [Configure Security Groups (Firewall)](#2-configure-security-groups)
3. [Connect to EC2 and Install Prerequisites](#3-connect-to-ec2-and-install-prerequisites)
4. [Clone Repository & Set Environment Variables](#4-clone-repository--configure-env)
5. [Database Migrations (Prisma)](#5-database-migrations)
6. [Build & Run with Docker Compose](#6-build--run-with-docker-compose)
7. [Configure Nginx as Reverse Proxy](#7-configure-nginx-as-reverse-proxy)
8. [Setup Free SSL (HTTPS) with Certbot](#8-setup-free-ssl-https-with-certbot)
9. [Setting Up Background Auto-Restarts and Updates](#9-updates--maintenance)

---

## 1. Launch AWS EC2 Instance

1. Log in to the [AWS Management Console](https://console.aws.amazon.com/ec2/).
2. Select your nearest AWS Region (e.g., `ap-south-1` Mumbai or `us-east-1` N. Virginia).
3. Go to **EC2** → Click **Launch Instance**.
4. Configure the instance:
   - **Name**: `tradeguard-ai-prod`
   - **OS / AMI**: `Ubuntu Server 22.04 LTS` (64-bit x86 or ARM)
   - **Instance Type**:
     - `t3.small` (2 vCPU, 2 GB RAM) — *Recommended minimum*
     - `t4g.small` (2 vCPU, 2 GB RAM Graviton) — *Cheaper alternative*
   - **Key Pair**: Select an existing key pair or **Create new key pair** (`.pem` format) and download it to your PC.
   - **Storage**: Change 8 GiB to **20 GiB or 30 GiB gp3**.

---

## 2. Configure Security Groups

In the **Network Settings** section during instance launch (or under **Security Groups**):
Add the following **Inbound Rules**:

| Type | Protocol | Port Range | Source | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **SSH** | TCP | `22` | `My IP` (or `0.0.0.0/0`) | Remote server access |
| **HTTP** | TCP | `80` | `0.0.0.0/0` | Web traffic (redirects to HTTPS) |
| **HTTPS** | TCP | `443` | `0.0.0.0/0` | Secure web traffic |

Click **Launch Instance**.

---

## 3. Connect to EC2 and Install Prerequisites

### 3.1 Connect via SSH
Open PowerShell / Terminal on your computer:
```bash
# On Linux/macOS or Windows PowerShell (ensure chmod 400 for key file on Linux/Mac)
ssh -i "path/to/your-key.pem" ubuntu@<YOUR_EC2_PUBLIC_IP>
```

### 3.2 Run the Automated Setup Script
Once inside your EC2 server:
```bash
# Update and install Docker, Docker Compose, Nginx, Certbot
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw nginx certbot python3-certbot-nginx docker.io docker-compose

# Add ubuntu user to docker group
sudo usermod -aG docker ubuntu

# Apply docker group without logging out
newgrp docker
```

---

## 4. Clone Repository & Configure `.env`

### 4.1 Clone Code
```bash
git clone https://github.com/<your-username>/<your-repo-name>.git tradeguard
cd tradeguard
```

### 4.2 Create `.env.production`
```bash
cp .env.production.example .env.production
nano .env.production
```
Fill in your production credentials:
```env
# Database (AWS RDS PostgreSQL or Neon/Supabase)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/tradeguard?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/tradeguard?sslmode=require"

# AI Models (Azure OpenAI or GitHub Models)
AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com"
AZURE_OPENAI_API_KEY="your-key"
AZURE_OPENAI_DEPLOYMENT_NAME="gpt-4o"

# Real-time Pusher
PUSHER_APP_ID="your-app-id"
PUSHER_KEY="your-key"
PUSHER_SECRET="your-secret"
PUSHER_CLUSTER="mt1"
NEXT_PUBLIC_PUSHER_KEY="your-key"
NEXT_PUBLIC_PUSHER_CLUSTER="mt1"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_..."
CLERK_SECRET_KEY="sk_live_..."

# Security
CRON_SECRET="your-32-char-random-secret"
```
Press `Ctrl + O`, then `Enter` to save, and `Ctrl + X` to exit.

---

## 5. Database Migrations

Run database schema migration to ensure tables exist in your PostgreSQL instance:
```bash
# Install Node.js temporarily or use npx with Docker to run migration
sudo apt install -y nodejs npm
npm install -g prisma
npx prisma db push --schema=prisma/schema.prisma
```

---

## 6. Build & Run with Docker Compose

Build and launch the Next.js app and Python regime microservice in background:
```bash
docker-compose up -d --build
```

Verify containers are running:
```bash
docker ps
```
You should see `tradeguard-web` running on port 3000 and `tradeguard-regime` on port 8000.

---

## 7. Configure Nginx as Reverse Proxy

Create an Nginx configuration file:
```bash
sudo nano /etc/nginx/sites-available/tradeguard
```

Paste the following (replace `yourdomain.com` with your domain or EC2 Public IP):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Forward Next.js App
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

    # Forward Market Regime Microservice (optional external access)
    location /regime-api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Enable the configuration and reload Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/tradeguard /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

---

## 8. Setup Free SSL (HTTPS) with Certbot

Point your Domain's **A Record** (e.g. at Namecheap, GoDaddy, Cloudflare, Route53) to your **EC2 Public IPv4 Address**.

Then execute:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```
Certbot will configure SSL automatically and setup automatic certificate renewal.

---

## 9. Updates & Maintenance

When you push new updates to your GitHub repository:
```bash
cd ~/tradeguard
git pull origin main
docker-compose up -d --build
```
Everything will rebuild with zero downtime.
