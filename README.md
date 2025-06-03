# 📱 EDEKA Artikel-Bestellungs-App

Eine moderne, mobile-freundliche Web-App zur schnellen Erfassung von Artikelbestellungen mit KI-basierter Bilderkennung.

## ✨ Features

- **📸 Intelligenter Bild-Upload**: Unterstützt Smartphone-Kamera und Desktop-Uploads
- **🤖 KI-Bilderkennung**: Automatische Artikel-Erkennung aus Produktfotos, Etiketten oder Preisschildern
- **⚡ Parallele Bearbeitung**: Nutzer können während der KI-Analyse bereits andere Felder ausfüllen
- **📱 Mobile-First Design**: Optimiert für Smartphone und Desktop
- **🎨 EDEKA Corporate Design**: Verwendet die offizielle EDEKA-Farbe (#2b64b1)
- **✅ Echtzeitfeedback**: Sofortige Bestätigung bei erfolgreichem Absenden
- **🛡️ Fehlerbehandlung**: Robuste Behandlung von Netzwerk- und API-Fehlern

## 🛠️ Technologie-Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **Sprache**: TypeScript
- **APIs**: RESTful API-Endpunkte
- **Responsive Design**: Mobile-First Ansatz

## 🚀 Installation & Start

1. **Abhängigkeiten installieren**:
   ```bash
   npm install
   ```

2. **Entwicklungsserver starten**:
   ```bash
   npm run dev
   ```

3. **App öffnen**: 
   - Browser: http://localhost:3000
   - Auf Smartphone: http://[IHRE-IP]:3000

## 📋 Verwendung

### 1. Artikel-Foto hochladen
- Klicken Sie auf den Upload-Bereich
- Wählen Sie ein Foto von Ihrem Gerät oder machen Sie ein neues
- Die KI analysiert das Bild automatisch (2-5 Sekunden)

### 2. Bestelldaten eingeben
Während die KI arbeitet, können Sie bereits ausfüllen:
- **Menge**: z.B. "5 Stück", "2 Packungen", "1kg"
- **Abteilung**: Dropdown mit vordefinierten Optionen
- **Kommentar**: Optionale zusätzliche Informationen

### 3. Artikel bestätigen
- Nach der KI-Analyse wird der Artikel automatisch erkannt
- Sie können den erkannten Artikel noch korrigieren
- Bei Erkennungsfehlern erhalten Sie einen Hinweis

### 4. Bestellung absenden
- Klicken Sie auf "✅ Bestellung abschicken"
- Erhalten Sie eine Bestätigung mit grünem Häkchen
- Das Formular wird automatisch zurückgesetzt

## 🔧 API-Endpunkte

### POST `/api/erkennen`
Bilderkennung für Artikel

**Request**: 
- `FormData` mit Bild-Datei

**Response**:
```json
{
  "success": true,
  "artikel": "Erkannter Produktname",
  "confidence": 0.85,
  "verarbeitungsZeit": 3200
}
```

### POST `/api/bestellen`
Bestelldaten absenden

**Request**:
```json
{
  "artikel": "Produktname",
  "menge": "5 Stück",
  "abteilung": "Obst & Gemüse",
  "kommentar": "Optional",
  "bildUrl": "data:image/..."
}
```

**Response**:
```json
{
  "success": true,
  "bestellNummer": "B1699123456789123",
  "zeitstempel": "2024-01-15T10:30:00.000Z",
  "status": "eingegangen"
}
```

## 🏪 Verfügbare Abteilungen

- Obst & Gemüse
- Drogerie
- Bäckerei
- Fleisch & Wurst
- Molkereiprodukte
- Tiefkühl
- Getränke
- Süßwaren
- Konserven
- Haushalt
- Sonstige

## 📱 Mobile Optimierung

Die App ist vollständig für mobile Geräte optimiert:
- Touch-freundliche Benutzeroberfläche
- Responsive Design für alle Bildschirmgrößen
- Optimierte Formulareingaben für Smartphones
- Kamera-Integration für direktes Fotografieren

## 🎨 Design-System

- **Primärfarbe**: EDEKA Blau (#2b64b1)
- **Hover-Effekte**: Dunkleres Blau (#1e4a8c)
- **Erfolg**: Grün mit Häkchen-Symbol
- **Warnung**: Gelb für nicht erkannte Artikel
- **Fehler**: Rot für Systemfehler
- **Lade-Animationen**: Spinning-Loader in Markenfarbe

## 🔄 Entwicklung

### Scripts
```bash
npm run dev      # Entwicklungsserver
npm run build    # Produktions-Build
npm run start    # Produktionsserver
npm run lint     # Code-Qualität prüfen
```

### Ordnerstruktur
```
src/
├── app/
│   ├── api/
│   │   ├── erkennen/route.ts    # Bilderkennung API
│   │   └── bestellen/route.ts   # Bestellung API
│   ├── globals.css              # Globale Styles
│   ├── layout.tsx               # App Layout
│   └── page.tsx                 # Hauptkomponente
```

## 🔮 Erweiternsmöglichkeiten

- **Echte KI-Integration**: Anbindung an Computer Vision APIs
- **Datenbank**: Persistierung von Bestellungen
- **Benutzer-Management**: Login und Bestellhistorie
- **Push-Notifications**: Statusupdates für Bestellungen
- **Barcode-Scanner**: QR/Barcode-Erkennung zusätzlich zu Bildern
- **Offline-Modus**: Lokale Zwischenspeicherung bei schlechter Verbindung

## 🐛 Bekannte Limitierungen

- KI-Erkennung ist aktuell simuliert (Demo-Zwecke)
- Bilder werden nicht persistent gespeichert
- Keine Benutzerauthentifizierung
- Bestellungen werden nur geloggt, nicht gespeichert

## 📄 Lizenz

Dieses Projekt wurde für Demonstrationszwecke erstellt.

---

**Entwickelt mit ❤️ für EDEKA**
