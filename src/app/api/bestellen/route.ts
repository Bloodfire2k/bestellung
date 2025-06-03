import { NextRequest, NextResponse } from 'next/server';

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
  bildUrl?: string;
}

export async function POST(request: NextRequest) {
  try {
    const bestellungData: BestellungData = await request.json();
    
    // Validierung der Pflichtfelder
    if (!bestellungData.artikel_liste?.length || !bestellungData.kundenname || !bestellungData.telefonnummer) {
      return NextResponse.json(
        { message: 'Mindestens ein Artikel, Kundenname und Telefonnummer sind Pflichtfelder' },
        { status: 400 }
      );
    }

    // Validierung jedes Artikels
    for (const artikel of bestellungData.artikel_liste) {
      if (!artikel.artikel || !artikel.menge || !artikel.abteilung) {
        return NextResponse.json(
          { message: 'Jeder Artikel muss Name, Menge und Abteilung haben' },
          { status: 400 }
        );
      }
    }

    // Generiere eine Bestellnummer
    const bestellNummer = 'B' + Date.now().toString() + Math.floor(Math.random() * 1000);
    
    // N8n-kompatibles JSON-Format erstellen
    const n8nFormat = {
      bestellung: {
        bestellnummer: bestellNummer,
        zeitstempel: new Date().toISOString(),
        status: 'eingegangen',
        kunde: {
          name: bestellungData.kundenname,
          telefon: bestellungData.telefonnummer
        },
        artikel_liste: bestellungData.artikel_liste.map(artikel => ({
          artikel_name: artikel.artikel,
          ean: artikel.ean || null,
          menge: artikel.menge,
          abteilung: artikel.abteilung,
          kommentar: artikel.kommentar || null
        })),
        artikel_anzahl: bestellungData.artikel_liste.length,
        hat_bild: !!bestellungData.bildUrl
      }
    };

    // Logging für Entwicklungszwecke
    console.log('Neue Mehrfach-Bestellung erhalten:', n8nFormat);

    // Simuliere Verarbeitungszeit
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    // Simuliere gelegentliche Fehler für realistische Tests (5% Fehlerrate)
    if (Math.random() < 0.05) {
      return NextResponse.json(
        { 
          error: 'Temporärer Serverfehler',
          message: 'Die Bestellung konnte momentan nicht verarbeitet werden. Bitte versuchen Sie es erneut.'
        },
        { status: 500 }
      );
    }

    return NextResponse.json(n8nFormat, { status: 201 });

  } catch (error) {
    console.error('Fehler beim Verarbeiten der Bestellung:', error);
    return NextResponse.json(
      { 
        error: 'Serverfehler',
        message: 'Ein unerwarteter Fehler ist aufgetreten.'
      },
      { status: 500 }
    );
  }
} 