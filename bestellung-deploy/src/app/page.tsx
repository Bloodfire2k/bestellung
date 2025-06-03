'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

interface ArtikelItem {
  id: string;
  artikel: string;
  ean?: string;
  menge: string;
  abteilung: string;
  kommentar?: string;
}

interface BestellungData {
  artikel_liste: ArtikelItem[];
  kundenname: string;
  telefonnummer: string;
}

interface AktuellerArtikel {
  artikel: string;
  ean: string;
  menge: string;
  abteilung: string;
  kommentar: string;
}

export default function BestellungsApp() {
  const [bildPreview, setBildPreview] = useState<string | null>(null);
  const [artikelErkennung, setArtikelErkennung] = useState<{
    loading: boolean;
    erkannt: string | null;
    eanErkannt: string | null;
    fehler: boolean;
    costInfo?: {
      originalSizeKB: number;
      optimizedSizeKB: number;
      estimatedTokens: number;
      estimatedCostUSD: number;
    };
  }>({
    loading: false,
    erkannt: null,
    eanErkannt: null,
    fehler: false,
  });
  
  // Aktueller Artikel im Formular
  const [aktuellerArtikel, setAktuellerArtikel] = useState<AktuellerArtikel>({
    artikel: '',
    ean: '',
    menge: '',
    abteilung: '',
    kommentar: '',
  });

  // Finale Bestelldaten mit Artikel-Liste
  const [bestelldaten, setBestelldaten] = useState<BestellungData>({
    artikel_liste: [],
    kundenname: '',
    telefonnummer: '',
  });
  
  const [bestellungStatus, setBestellungStatus] = useState<{
    erfolgreich: boolean;
    loading: boolean;
    fehler: string | null;
  }>({
    erfolgreich: false,
    loading: false,
    fehler: null,
  });

  const [komprimierungStatus, setKomprimierungStatus] = useState<{
    loading: boolean;
    ersparnis: number | null;
  }>({
    loading: false,
    ersparnis: null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const abteilungen = [
    'Obst & Gemüse',
    'Drogerie',
    'Bäckerei',
    'Fleisch & Wurst',
    'Molkereiprodukte',
    'Tiefkühl',
    'Getränke',
    'Süßwaren',
    'Konserven',
    'Haushalt',
    'Sonstige'
  ];

  // Hilfsfunktion zur Bildkomprimierung
  const compressImage = (file: File, maxWidth: number = 1024, maxHeight: number = 1024, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file); // Fallback wenn Canvas nicht unterstützt wird
        return;
      }
      
      const img = document.createElement('img') as HTMLImageElement;
      
      img.onload = () => {
        // Berechne neue Dimensionen unter Beibehaltung des Seitenverhältnisses
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        // Canvas-Größe setzen
        canvas.width = width;
        canvas.height = height;
        
        // Bild auf Canvas zeichnen (komprimiert)
        ctx.drawImage(img, 0, 0, width, height);
        
        // Canvas zu Blob konvertieren
        canvas.toBlob((blob) => {
          if (blob) {
            // Neuen File aus Blob erstellen
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg', // Immer JPEG für beste Komprimierung
              lastModified: Date.now(),
            });
            
            console.log(`🖼️ Bildkomprimierung: ${(file.size / 1024).toFixed(1)}KB → ${(compressedFile.size / 1024).toFixed(1)}KB (${((1 - compressedFile.size / file.size) * 100).toFixed(1)}% Ersparnis)`);
            resolve(compressedFile);
          } else {
            resolve(file); // Fallback bei Fehlern
          }
        }, 'image/jpeg', quality);
      };
      
      img.onerror = () => {
        resolve(file); // Fallback bei Bildlade-Fehlern
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleBildUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log(`📸 Original-Bild: ${(file.size / 1024).toFixed(1)}KB`);

    // Komprimierung starten
    setKomprimierungStatus({ loading: true, ersparnis: null });

    // Bild komprimieren für Kosten-Optimierung
    let compressedFile = file;
    if (file.size > 100 * 1024) { // Nur komprimieren wenn größer als 100KB
      try {
        compressedFile = await compressImage(file, 1024, 1024, 0.8);
        const ersparnis = ((1 - compressedFile.size / file.size) * 100);
        setKomprimierungStatus({ loading: false, ersparnis });
      } catch (error) {
        console.warn('Bildkomprimierung fehlgeschlagen, verwende Original:', error);
        compressedFile = file;
        setKomprimierungStatus({ loading: false, ersparnis: null });
      }
    } else {
      setKomprimierungStatus({ loading: false, ersparnis: null });
    }

    // Bild-Preview erstellen (vom komprimierten Bild)
    const reader = new FileReader();
    reader.onload = (e) => {
      setBildPreview(e.target?.result as string);
    };
    reader.readAsDataURL(compressedFile);

    // Artikel-Erkennung starten
    setArtikelErkennung({ loading: true, erkannt: null, eanErkannt: null, fehler: false });
    
    try {
      const formData = new FormData();
      formData.append('file', compressedFile); // Komprimiertes Bild verwenden
      
      const response = await fetch('/api/erkennen', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const result = await response.json();
        setArtikelErkennung({
          loading: false,
          erkannt: result.artikel || null,
          eanErkannt: result.ean || null,
          fehler: !result.artikel,
          costInfo: result.costInfo || undefined,
        });
        
        if (result.artikel) {
          setAktuellerArtikel(prev => ({ ...prev, artikel: result.artikel }));
        }
        if (result.ean) {
          setAktuellerArtikel(prev => ({ ...prev, ean: result.ean }));
        }
      } else {
        setArtikelErkennung({
          loading: false,
          erkannt: null,
          eanErkannt: null,
          fehler: true,
        });
      }
    } catch (error) {
      console.error('Fehler bei der Artikel-Erkennung:', error);
      setArtikelErkennung({
        loading: false,
        erkannt: null,
        eanErkannt: null,
        fehler: true,
      });
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bestelldaten.artikel_liste.length || !bestelldaten.kundenname || !bestelldaten.telefonnummer) {
      alert('Bitte fügen Sie mindestens einen Artikel hinzu und füllen Sie alle Kundendaten aus.');
      return;
    }

    setBestellungStatus({ erfolgreich: false, loading: true, fehler: null });

    try {
      const bestellungData = {
        ...bestelldaten,
        bildUrl: bildPreview || undefined,
      };

      const response = await fetch('/api/bestellen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bestellungData),
      });

      if (response.ok) {
        setBestellungStatus({ erfolgreich: true, loading: false, fehler: null });
        
        // Formular zurücksetzen nach 3 Sekunden
        setTimeout(() => {
          setBestelldaten({ artikel_liste: [], kundenname: '', telefonnummer: '' });
          setAktuellerArtikel({ artikel: '', ean: '', menge: '', abteilung: '', kommentar: '' });
          setBildPreview(null);
          setArtikelErkennung({ loading: false, erkannt: null, eanErkannt: null, fehler: false });
          setKomprimierungStatus({ loading: false, ersparnis: null });
          setBestellungStatus({ erfolgreich: false, loading: false, fehler: null });
        }, 3000);
      } else {
        const errorData = await response.json();
        setBestellungStatus({
          erfolgreich: false,
          loading: false,
          fehler: errorData.message || 'Fehler beim Absenden der Bestellung',
        });
      }
    } catch (error) {
      console.error('Fehler beim Absenden:', error);
      setBestellungStatus({
        erfolgreich: false,
        loading: false,
        fehler: 'Netzwerkfehler beim Absenden der Bestellung',
      });
    }
  };

  // Handler für aktuellen Artikel
  const handleArtikelInputChange = (field: keyof AktuellerArtikel, value: string) => {
    setAktuellerArtikel(prev => ({ ...prev, [field]: value }));
  };

  // Handler für Bestelldaten (Kunde)
  const handleBestelldatenChange = (field: keyof BestellungData, value: string) => {
    setBestelldaten(prev => ({ ...prev, [field]: value }));
  };

  // Artikel zur Liste hinzufügen
  const handleArtikelHinzufuegen = () => {
    if (!aktuellerArtikel.artikel || !aktuellerArtikel.menge || !aktuellerArtikel.abteilung) {
      alert('Bitte füllen Sie alle Pflichtfelder für den Artikel aus.');
      return;
    }

    const neuerArtikel: ArtikelItem = {
      id: Date.now().toString(),
      artikel: aktuellerArtikel.artikel,
      ean: aktuellerArtikel.ean || undefined,
      menge: aktuellerArtikel.menge,
      abteilung: aktuellerArtikel.abteilung,
      kommentar: aktuellerArtikel.kommentar || undefined,
    };

    setBestelldaten(prev => ({
      ...prev,
      artikel_liste: [...prev.artikel_liste, neuerArtikel]
    }));

    // Artikel-Formular zurücksetzen
    setAktuellerArtikel({ artikel: '', ean: '', menge: '', abteilung: '', kommentar: '' });
    setBildPreview(null);
    setArtikelErkennung({ loading: false, erkannt: null, eanErkannt: null, fehler: false });
  };

  // Artikel aus Liste entfernen
  const handleArtikelEntfernen = (id: string) => {
    setBestelldaten(prev => ({
      ...prev,
      artikel_liste: prev.artikel_liste.filter(artikel => artikel.id !== id)
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-[#2b64b1] text-white p-6 text-center">
          <h1 className="text-2xl font-bold">📱 Artikel Bestellung</h1>
          <p className="text-blue-100 mt-2">Schnell und einfach bestellen</p>
        </div>

        {/* Success Message */}
        {bestellungStatus.erfolgreich && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 m-4">
            <div className="flex items-center">
              <div className="text-green-600 text-2xl mr-3">✅</div>
              <div>
                <p className="text-green-800 font-semibold">Bestellung erfolgreich abgesendet!</p>
                <p className="text-green-600 text-sm">Das Formular wird automatisch zurückgesetzt...</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
          {/* Bild Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📸 Artikel-Foto hochladen *
            </label>
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-[#2b64b1] transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {bildPreview ? (
                <div className="space-y-2">
                  <div className="relative w-full h-48 rounded-lg overflow-hidden">
                    <Image
                      src={bildPreview}
                      alt="Hochgeladenes Bild"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <p className="text-sm text-gray-600">Klicken zum Ändern</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-4xl text-gray-400">📷</div>
                  <p className="text-gray-600">Bild hochladen</p>
                  <p className="text-sm text-gray-400">Produktfoto, Etikett oder Preisschild</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleBildUpload}
              className="hidden"
            />
          </div>

          {/* Komprimierung Status */}
          {komprimierungStatus.loading && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600 mr-3"></div>
                <p className="text-purple-800 font-medium">🖼️ Bild wird komprimiert für optimale Kosten...</p>
              </div>
            </div>
          )}

          {komprimierungStatus.ersparnis !== null && !komprimierungStatus.loading && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="text-green-600 text-xl mr-3">✂️</div>
                <div>
                  <p className="text-green-800 font-medium">Bild erfolgreich komprimiert!</p>
                  <p className="text-green-600 text-sm">
                    {komprimierungStatus.ersparnis.toFixed(1)}% Größenreduktion • Niedrigere API-Kosten
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Artikel-Erkennung Status */}
          {artikelErkennung.loading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#2b64b1] mr-3"></div>
                <p className="text-[#2b64b1] font-medium">KI analysiert das Bild detailliert...</p>
              </div>
            </div>
          )}

          {artikelErkennung.fehler && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="text-yellow-600 text-xl mr-3">⚠️</div>
                <p className="text-yellow-800">Produkt konnte nicht erkannt werden. Bitte manuell eingeben.</p>
              </div>
            </div>
          )}

          {(artikelErkennung.erkannt || artikelErkennung.eanErkannt) && !artikelErkennung.loading && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="text-green-600 text-xl mr-3">✅</div>
                <p className="text-green-800 font-medium">Produkt erfolgreich erkannt!</p>
              </div>
            </div>
          )}

          {/* Artikel Name */}
          <div>
            <label htmlFor="artikel" className="block text-sm font-medium text-gray-700 mb-2">
              🏷️ Artikel *
            </label>
            <input
              type="text"
              id="artikel"
              value={aktuellerArtikel.artikel}
              onChange={(e) => handleArtikelInputChange('artikel', e.target.value)}
              placeholder={artikelErkennung.loading ? "Wird automatisch erkannt..." : "Artikel-Name eingeben"}
              disabled={artikelErkennung.loading}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2b64b1] focus:border-[#2b64b1] disabled:bg-gray-100 disabled:cursor-not-allowed text-lg"
              required
            />
          </div>

          {/* EAN */}
          <div>
            <label htmlFor="ean" className="block text-sm font-medium text-gray-700 mb-2">
              🔢 EAN/Barcode (optional)
            </label>
            <input
              type="text"
              id="ean"
              value={aktuellerArtikel.ean}
              onChange={(e) => handleArtikelInputChange('ean', e.target.value)}
              placeholder={artikelErkennung.loading ? "Wird automatisch ermittelt..." : "z.B. 4000177021927 (13-stellig)"}
              disabled={artikelErkennung.loading}
              maxLength={13}
              pattern="\d{13}"
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2b64b1] focus:border-[#2b64b1] disabled:bg-gray-100 disabled:cursor-not-allowed text-lg"
            />
            <p className="text-xs text-gray-500 mt-1">
              13-stelliger EAN-Code des Produkts (wird automatisch ermittelt)
            </p>
          </div>

          {/* Menge */}
          <div>
            <label htmlFor="menge" className="block text-sm font-medium text-gray-700 mb-2">
              📦 Menge *
            </label>
            <input
              type="text"
              id="menge"
              value={aktuellerArtikel.menge}
              onChange={(e) => handleArtikelInputChange('menge', e.target.value)}
              placeholder="z.B. 5 Stück, 2 Packungen, 1kg"
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2b64b1] focus:border-[#2b64b1] text-lg"
              required
            />
          </div>

          {/* Abteilung */}
          <div>
            <label htmlFor="abteilung" className="block text-sm font-medium text-gray-700 mb-2">
              🏪 Abteilung *
            </label>
            <select
              id="abteilung"
              value={aktuellerArtikel.abteilung}
              onChange={(e) => handleArtikelInputChange('abteilung', e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2b64b1] focus:border-[#2b64b1] text-lg"
              required
            >
              <option value="">Abteilung wählen</option>
              {abteilungen.map((abteilung) => (
                <option key={abteilung} value={abteilung}>
                  {abteilung}
                </option>
              ))}
            </select>
          </div>

          {/* Kommentar */}
          <div>
            <label htmlFor="kommentar" className="block text-sm font-medium text-gray-700 mb-2">
              💬 Kommentar (optional)
            </label>
            <textarea
              id="kommentar"
              value={aktuellerArtikel.kommentar}
              onChange={(e) => handleArtikelInputChange('kommentar', e.target.value)}
              placeholder="Zusätzliche Informationen oder Anmerkungen..."
              rows={3}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2b64b1] focus:border-[#2b64b1] text-lg resize-none"
            />
          </div>

          {/* Artikel hinzufügen Button */}
          <button
            type="button"
            onClick={handleArtikelHinzufuegen}
            disabled={!aktuellerArtikel.artikel || !aktuellerArtikel.menge || !aktuellerArtikel.abteilung}
            className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold text-lg hover:bg-green-700 focus:ring-4 focus:ring-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            <span>➕</span>
            <span>Artikel zur Bestellung hinzufügen</span>
          </button>

          {/* Artikel-Liste anzeigen */}
          {bestelldaten.artikel_liste.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">🛒 Artikel in der Bestellung ({bestelldaten.artikel_liste.length})</h3>
              <div className="space-y-2">
                {bestelldaten.artikel_liste.map((artikel) => (
                  <div key={artikel.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{artikel.artikel}</p>
                      <p className="text-sm text-gray-600">
                        📦 {artikel.menge} • 🏪 {artikel.abteilung}
                        {artikel.ean && ` • 🔢 ${artikel.ean}`}
                      </p>
                      {artikel.kommentar && (
                        <p className="text-sm text-gray-500 mt-1">💬 {artikel.kommentar}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleArtikelEntfernen(artikel.id)}
                      className="ml-4 text-red-600 hover:text-red-800 font-medium text-sm"
                    >
                      🗑️ Entfernen
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Kundenname */}
          <div>
            <label htmlFor="kundenname" className="block text-sm font-medium text-gray-700 mb-2">
              👤 Kundenname *
            </label>
            <input
              type="text"
              id="kundenname"
              value={bestelldaten.kundenname}
              onChange={(e) => handleBestelldatenChange('kundenname', e.target.value)}
              placeholder="Vor- und Nachname"
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2b64b1] focus:border-[#2b64b1] text-lg"
              required
            />
          </div>

          {/* Telefonnummer */}
          <div>
            <label htmlFor="telefonnummer" className="block text-sm font-medium text-gray-700 mb-2">
              📞 Telefonnummer *
            </label>
            <input
              type="tel"
              id="telefonnummer"
              value={bestelldaten.telefonnummer}
              onChange={(e) => handleBestelldatenChange('telefonnummer', e.target.value)}
              placeholder="z.B. 0123 456789 oder 01234 567890"
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2b64b1] focus:border-[#2b64b1] text-lg"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Für Rückfragen zur Bestellung
            </p>
          </div>

          {/* Error Message */}
          {bestellungStatus.fehler && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="text-red-600 text-xl mr-3">❌</div>
                <p className="text-red-800">{bestellungStatus.fehler}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={bestellungStatus.loading || artikelErkennung.loading}
            className="w-full bg-[#2b64b1] text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            {bestellungStatus.loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Wird abgesendet...</span>
              </>
            ) : (
              <>
                <span>✅</span>
                <span>Bestellung abschicken</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
