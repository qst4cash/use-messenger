#!/bin/bash
set -e

echo "🔐 Generating self-signed SSL certificate..."

# Create ssl directory
mkdir -p /opt/use-messenger/ssl

# Get server IP
SERVER_IP=$(curl -s ifconfig.me)

# Generate self-signed certificate
openssl req -x509 -newkey rsa:4096 \
  -keyout /opt/use-messenger/ssl/key.pem \
  -out /opt/use-messenger/ssl/cert.pem \
  -days 365 -nodes \
  -subj "/C=US/ST=State/L=City/O=USE Messenger/CN=$SERVER_IP"

# Set permissions
chmod 644 /opt/use-messenger/ssl/cert.pem
chmod 600 /opt/use-messenger/ssl/key.pem

echo "✅ SSL certificate generated!"
echo "📍 Certificate: /opt/use-messenger/ssl/cert.pem"
echo "🔑 Private key: /opt/use-messenger/ssl/key.pem"
echo "🌐 Common Name: $SERVER_IP"
echo ""
echo "⚠️  This is a self-signed certificate. Browsers will show a warning."
echo "    Click 'Advanced' → 'Proceed to site' to access."
