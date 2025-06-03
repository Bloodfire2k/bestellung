#!/bin/bash

# 🚀 Automatisches Deployment-Skript für bestellung.myfire.cloud
# Verwendung: ./deploy.sh

set -e

echo "🚀 Starte Deployment für EDEKA Bestellungs-App..."

# Variablen
APP_DIR="/var/www/bestellung"
NGINX_SITE="bestellung.myfire.cloud"
PM2_APP="bestellung-app"

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funktionen
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 0. Automatische Ordner-Erstellung (falls nicht vorhanden)
log_info "Prüfe und erstelle App-Verzeichnis falls nötig..."
if [ ! -d "$APP_DIR" ]; then
    log_warning "App-Verzeichnis existiert nicht, erstelle: $APP_DIR"
    sudo mkdir -p "$APP_DIR"
    sudo chown -R $USER:$USER "$APP_DIR"
    log_success "App-Verzeichnis erstellt mit Berechtigungen für User: $USER"
fi

# Falls das Skript vom aktuellen Verzeichnis aus läuft, kopiere Dateien
if [ "$PWD" != "$APP_DIR" ] && [ -f "package.json" ]; then
    log_info "Kopiere Dateien ins App-Verzeichnis..."
    cp -r * "$APP_DIR/"
    log_success "Dateien kopiert nach $APP_DIR"
fi

# 1. Verzeichnis prüfen/erstellen
log_info "Prüfe App-Verzeichnis..."
if [ ! -d "$APP_DIR" ]; then
    log_warning "Erstelle App-Verzeichnis: $APP_DIR"
    sudo mkdir -p "$APP_DIR"
    sudo chown -R $USER:$USER "$APP_DIR"
fi

# 2. Dependencies prüfen
log_info "Prüfe Node.js Installation..."
if ! command -v node &> /dev/null; then
    log_error "Node.js ist nicht installiert!"
    echo "Installiere Node.js 18+:"
    echo "curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
    echo "sudo apt-get install -y nodejs"
    exit 1
fi

log_info "Prüfe PM2 Installation..."
if ! command -v pm2 &> /dev/null; then
    log_warning "PM2 nicht gefunden, installiere..."
    sudo npm install -g pm2
fi

log_info "Prüfe Nginx Installation..."
if ! command -v nginx &> /dev/null; then
    log_error "Nginx ist nicht installiert!"
    echo "sudo apt update && sudo apt install nginx"
    exit 1
fi

# 3. App-Code aktualisieren
cd "$APP_DIR"
log_info "Aktualisiere App-Code..."

# Dependencies installieren
log_info "Installiere Dependencies..."
npm install

# Environment-Variablen prüfen
if [ ! -f ".env.local" ]; then
    log_warning ".env.local nicht gefunden!"
    echo "Erstelle .env.local mit deinem OpenAI API Key:"
    echo "OPENAI_API_KEY=sk-your-api-key-here"
    echo "NODE_ENV=production"
    echo ""
    read -p "OpenAI API Key eingeben: " api_key
    cat > .env.local << EOF
OPENAI_API_KEY=$api_key
NODE_ENV=production
PORT=3001
EOF
    log_success ".env.local erstellt"
fi

# 4. Production Build
log_info "Erstelle Production Build..."
npm run build

# 5. PM2 Setup
log_info "Konfiguriere PM2..."

# Stoppe alte Instanz falls vorhanden
if pm2 list | grep -q "$PM2_APP"; then
    log_info "Stoppe laufende App-Instanz..."
    pm2 stop "$PM2_APP"
    pm2 delete "$PM2_APP"
fi

# Starte neue Instanz
log_info "Starte App mit PM2..."
pm2 start ecosystem.config.js

# PM2 beim Systemstart aktivieren
pm2 startup --silent
pm2 save

log_success "PM2 konfiguriert"

# 6. Nginx Setup
log_info "Konfiguriere Nginx..."

# Nginx Konfiguration kopieren
sudo cp nginx-bestellung.conf "/etc/nginx/sites-available/$NGINX_SITE"

# Site aktivieren
if [ ! -L "/etc/nginx/sites-enabled/$NGINX_SITE" ]; then
    sudo ln -s "/etc/nginx/sites-available/$NGINX_SITE" "/etc/nginx/sites-enabled/"
    log_success "Nginx Site aktiviert"
fi

# Nginx Konfiguration testen
if sudo nginx -t; then
    log_success "Nginx Konfiguration ist gültig"
    sudo systemctl reload nginx
    log_success "Nginx neu geladen"
else
    log_error "Nginx Konfiguration fehlerhaft!"
    exit 1
fi

# 7. SSL-Zertifikat prüfen/erstellen
log_info "Prüfe SSL-Zertifikat..."
if [ ! -f "/etc/letsencrypt/live/$NGINX_SITE/fullchain.pem" ]; then
    log_warning "SSL-Zertifikat nicht gefunden!"
    
    # Prüfe ob Certbot installiert ist
    if ! command -v certbot &> /dev/null; then
        log_info "Installiere Certbot..."
        sudo apt update
        sudo apt install -y certbot python3-certbot-nginx
    fi
    
    log_info "Erstelle SSL-Zertifikat für $NGINX_SITE..."
    sudo certbot --nginx -d "$NGINX_SITE" --non-interactive --agree-tos --email admin@myfire.cloud
    
    if [ $? -eq 0 ]; then
        log_success "SSL-Zertifikat erstellt"
    else
        log_error "SSL-Zertifikat Erstellung fehlgeschlagen"
        log_warning "App läuft trotzdem auf HTTP"
    fi
else
    log_success "SSL-Zertifikat vorhanden"
fi

# 8. Firewall prüfen
log_info "Prüfe Firewall-Einstellungen..."
if command -v ufw &> /dev/null; then
    sudo ufw allow 'Nginx Full'
    sudo ufw allow 22
    log_success "Firewall konfiguriert"
fi

# 9. Status prüfen
log_info "Prüfe Service-Status..."

# PM2 Status
echo ""
echo "📊 PM2 Status:"
pm2 status

# Nginx Status
echo ""
echo "🌐 Nginx Status:"
sudo systemctl status nginx --no-pager

# App Erreichbarkeit testen
echo ""
log_info "Teste App-Erreichbarkeit..."
sleep 3

if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 | grep -q "200"; then
    log_success "App läuft auf Port 3001"
else
    log_warning "App nicht erreichbar auf Port 3001"
fi

# 10. Deployment abgeschlossen
echo ""
echo "🎉 Deployment abgeschlossen!"
echo ""
echo "📱 Die App sollte jetzt erreichbar sein unter:"
echo "   🌐 https://$NGINX_SITE"
echo "   🔧 Lokaler Test: http://localhost:3001"
echo ""
echo "📋 Nützliche Befehle:"
echo "   pm2 status                    # PM2 Status"
echo "   pm2 logs $PM2_APP            # App Logs"
echo "   pm2 restart $PM2_APP         # App neu starten"
echo "   sudo nginx -t                # Nginx Config testen"
echo "   sudo systemctl reload nginx  # Nginx neu laden"
echo ""
echo "🔧 Troubleshooting:"
echo "   tail -f /var/log/nginx/bestellung.error.log"
echo "   pm2 monit"
echo ""

# DNS-Hinweis
log_warning "Stelle sicher, dass der DNS A-Record für $NGINX_SITE auf diese Server-IP zeigt!"
echo "   Aktuelle Server-IP: $(curl -s ifconfig.me)"

log_success "Deployment erfolgreich abgeschlossen! 🚀" 