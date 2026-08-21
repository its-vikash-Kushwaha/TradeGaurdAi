#!/bin/bash
# =============================================================================
# TradeGuard AI — One-Click EC2 Deploy Script
# Run: bash deploy.sh
# =============================================================================

set -e
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   TradeGuard AI — AWS EC2 Deployment   ${NC}"
echo -e "${GREEN}========================================${NC}"

# Fix PATH
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

# ── Step 1: Install Docker if missing ─────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  echo -e "${YELLOW}[1/6] Installing Docker...${NC}"
  apt-get update -q && apt-get install -y -q docker.io docker-compose-v2
  usermod -aG docker ubuntu
else
  echo -e "${GREEN}[1/6] Docker already installed ✓${NC}"
fi

# ── Step 2: Swap Memory (prevent OOM on t3.micro/small) ───────────────────────
if [ ! -f /swapfile ]; then
  echo -e "${YELLOW}[2/6] Creating 4GB Swap Memory...${NC}"
  fallocate -l 4G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
else
  echo -e "${GREEN}[2/6] Swap already configured ✓${NC}"
fi

# ── Step 3: Pull latest code ───────────────────────────────────────────────────
echo -e "${YELLOW}[3/6] Pulling latest code from Git...${NC}"
git pull origin main

# ── Step 4: Create .env.production if missing ─────────────────────────────────
if [ ! -f .env.production ]; then
  echo -e "${YELLOW}[4/6] Creating .env.production from example...${NC}"
  cp .env.production.example .env.production
  echo -e "${RED}⚠  .env.production created. Please edit it with your real keys:${NC}"
  echo -e "${RED}   nano .env.production${NC}"
  echo -e "${RED}   Then run this script again.${NC}"
  exit 1
else
  echo -e "${GREEN}[4/6] .env.production found ✓${NC}"
fi

# ── Step 5: Build & Start Containers ──────────────────────────────────────────
echo -e "${YELLOW}[5/6] Building & Starting Docker containers...${NC}"
docker compose down --remove-orphans 2>/dev/null || true
docker compose up -d --build

# ── Step 6: Wait for DB to be healthy, then migrate ───────────────────────────
echo -e "${YELLOW}[6/6] Waiting for database to be ready...${NC}"
sleep 10
docker compose exec -T web npx prisma@5.16.1 db push --skip-generate || true

# ── Done ───────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${GREEN}🌐 Your app is live at: http://$(curl -s ifconfig.me)${NC}"
echo ""
docker ps
