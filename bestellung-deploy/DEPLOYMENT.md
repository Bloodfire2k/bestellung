# 🚀 Deployment Anleitung für bestellung.myfire.cloud

## 📋 Voraussetzungen
- Node.js 18+ installiert
- OpenAI API Key verfügbar
- Nginx als Reverse Proxy
- SSL-Zertifikat für bestellung.myfire.cloud

## 🔧 Server-Setup

### 1. App auf Server deployten

```bash
# Repository auf Server klonen/uploaden
git clone <repository-url> /var/www/bestellung
cd /var/www/bestellung

# Dependencies installieren
npm install

# Environment-Variablen setzen
cp .env.local.example .env.local
nano .env.local
```

### 2. Environment-Variablen (.env.local)
```env
OPENAI_API_KEY=sk-your-actual-openai-api-key
NODE_ENV=production
```

### 3. App für Production builden
```bash
# Production Build erstellen
npm run build

# App starten (läuft auf Port 3001)
npm run start:prod
```

## 🌐 Nginx Reverse Proxy Konfiguration

### 1. Nginx Site-Konfiguration erstellen
```bash
sudo nano /etc/nginx/sites-available/bestellung.myfire.cloud
```

### 2. Nginx Konfiguration
```nginx
server {
    listen 80;
    server_name bestellung.myfire.cloud;
    
    # HTTP zu HTTPS weiterleiten
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name bestellung.myfire.cloud;
    
    # SSL-Zertifikat (Let's Encrypt oder eigenes)
    ssl_certificate /etc/letsencrypt/live/bestellung.myfire.cloud/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bestellung.myfire.cloud/privkey.pem;
    
    # SSL-Konfiguration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Gzip Komprimierung
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # Client Upload-Größe (für Bilder)
    client_max_body_size 10M;
    
    # Reverse Proxy zu Next.js App
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts für API-Aufrufe (OpenAI)
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Statische Assets cachen
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_cache_valid 200 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # API-Routen
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Längere Timeouts für KI-Anfragen
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }
    
    # Error Pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
}
```

### 3. Site aktivieren
```bash
# Symbolic Link erstellen
sudo ln -s /etc/nginx/sites-available/bestellung.myfire.cloud /etc/nginx/sites-enabled/

# Nginx Konfiguration testen
sudo nginx -t

# Nginx neu starten
sudo systemctl reload nginx
```

## 🔒 SSL-Zertifikat (Let's Encrypt)

```bash
# Certbot installieren (falls nicht vorhanden)
sudo apt install certbot python3-certbot-nginx

# SSL-Zertifikat für Subdomain erstellen
sudo certbot --nginx -d bestellung.myfire.cloud

# Auto-Renewal prüfen
sudo certbot renew --dry-run
```

## 🔄 Process Management (PM2)

### 1. PM2 installieren
```bash
sudo npm install -g pm2
```

### 2. App mit PM2 starten
```bash
cd /var/www/bestellung

# PM2 Konfiguration erstellen
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'bestellung-app',
    script: 'npm',
    args: 'run start:prod',
    cwd: '/var/www/bestellung',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: '/var/log/bestellung-error.log',
    out_file: '/var/log/bestellung-out.log',
    log_file: '/var/log/bestellung-combined.log',
    time: true
  }]
};
EOF

# App mit PM2 starten
pm2 start ecosystem.config.js

# PM2 beim Systemstart aktivieren
pm2 startup
pm2 save
```

## 📱 Mobile PWA-Optimierungen

Die App ist bereits PWA-optimiert:
- ✅ Responsive Design
- ✅ Touch-freundliche Buttons
- ✅ Offline-fähige Manifest
- ✅ Mobile-optimierte Bildkomprimierung

## 🔍 Monitoring & Logs

```bash
# PM2 Status prüfen
pm2 status

# Logs anzeigen
pm2 logs bestellung-app

# Nginx Logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# App-Performance überwachen
pm2 monit
```

## 🚀 Deployment-Befehle

```bash
# Komplettes Deployment
cd /var/www/bestellung
git pull                    # Code aktualisieren
npm install                 # Dependencies
npm run build              # Production Build
pm2 restart bestellung-app # App neu starten
```

## 🌐 DNS-Konfiguration

Stelle sicher, dass ein A-Record für `bestellung.myfire.cloud` auf die Server-IP zeigt:

```
Type: A
Name: bestellung
Value: [Deine-Server-IP]
TTL: 300
```

## ✅ Erfolgskontrolle

Nach dem Deployment sollte die App unter https://bestellung.myfire.cloud erreichbar sein:

1. 🌐 **HTTPS-Weiterleitung** funktioniert
2. 📱 **Mobile-Optimierung** aktiv
3. 🤖 **KI-Bilderkennung** verfügbar
4. 📦 **Mehrfach-Bestellungen** möglich
5. 🔄 **N8n-JSON-Format** wird ausgegeben

## 🆘 Troubleshooting

### Port bereits belegt
```bash
# Port-Nutzung prüfen
sudo netstat -tlnp | grep :3001
sudo fuser -k 3001/tcp  # Port freigeben
```

### SSL-Probleme
```bash
# SSL-Zertifikat erneuern
sudo certbot renew --force-renewal -d bestellung.myfire.cloud
```

### App startet nicht
```bash
# Environment-Variablen prüfen
cat .env.local

# OpenAI API Key testen
curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models
``` 