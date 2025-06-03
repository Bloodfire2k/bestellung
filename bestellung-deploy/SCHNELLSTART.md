# ⚡ Schnellstart: bestellung.myfire.cloud

## 🚀 Einzeiler-Deployment

```bash
# 1. Code auf Server laden
scp -r bestellung/ user@server:/var/www/

# 2. Auf Server SSH einloggen
ssh user@server

# 3. Auto-Deployment starten
cd /var/www/bestellung
chmod +x deploy.sh
./deploy.sh
```

## 📋 Minimale Voraussetzungen

### DNS-Eintrag
```
A-Record: bestellung.myfire.cloud → [Server-IP]
```

### Server-Requirements
- ✅ Ubuntu/Debian Linux
- ✅ Port 80/443 offen
- ✅ Sudo-Rechte

## 🔧 Manuelle Alternative

Falls das Skript nicht läuft:

```bash
# 1. Dependencies
sudo apt update
sudo apt install nodejs npm nginx certbot python3-certbot-nginx
sudo npm install -g pm2

# 2. App Setup
cd /var/www/bestellung
npm install
echo "OPENAI_API_KEY=sk-your-key" > .env.local
npm run build

# 3. Services starten
pm2 start ecosystem.config.js
sudo cp nginx-bestellung.conf /etc/nginx/sites-available/bestellung.myfire.cloud
sudo ln -s /etc/nginx/sites-available/bestellung.myfire.cloud /etc/nginx/sites-enabled/
sudo certbot --nginx -d bestellung.myfire.cloud
sudo systemctl reload nginx
```

## ✅ Test

Nach Deployment sollte funktionieren:
- 🌐 **https://bestellung.myfire.cloud** - Haupt-App
- 📱 **Mobile-optimiert** - Touch-freundlich
- 🤖 **KI-Bilderkennung** - OpenAI GPT-4o Vision
- 📦 **Mehrfach-Artikel** - N8n-JSON-Output

## 🆘 Support

Bei Problemen:
```bash
# Logs prüfen
pm2 logs bestellung-app
sudo tail -f /var/log/nginx/bestellung.error.log

# Status prüfen
pm2 status
sudo systemctl status nginx
```

**Das war's! 🎉** 