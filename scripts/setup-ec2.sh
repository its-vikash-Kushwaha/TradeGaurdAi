#!/bin/bash
# =============================================================================
# TradeGuard AI — EC2 Setup Script (Ubuntu 22.04 / 24.04)
# Run with: curl -sSL https://raw.githubusercontent.com/.../scripts/setup-ec2.sh | bash
# =============================================================================

set -e

echo "🚀 Updating system packages..."
sudo apt update && sudo apt upgrade -y

echo "📦 Installing required dependencies..."
sudo apt install -y curl git ufw nginx certbot python3-certbot-nginx apt-transport-https ca-certificates gnupg lsb-release

echo "🐳 Installing Docker & Docker Compose..."
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg --yes
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin docker-compose

# Add current user to docker group
sudo usermod -aG docker $USER

echo "🔒 Configuring UFW Firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

echo "✅ Docker & Nginx installation complete!"
echo "⚠️  Please log out and log back in (or run 'newgrp docker') for docker group permissions to take effect."
