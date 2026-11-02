# Hausplaner – Startversion

Dies ist die erste technische Basis des Hausplaners. Sie enthält einen interaktiven 2D-Editor.

## Bereits umgesetzt
- Wände durch Setzen von Start- und Endpunkt zeichnen
- Raster und automatisches Einrasten (20 px Raster; in der Oberfläche als 1 m dargestellt)
- Wände auswählen
- Wandlänge anzeigen
- Wand löschen und duplizieren
- Zoom
- Rückgängig / Wiederholen
- Projektname ändern
- Projekt lokal im Browser speichern
- Projekt als JSON exportieren

## Noch nicht umgesetzt
3D-Ansicht, automatische Raumerkennung, verschiebbare Wand-Endpunkte, Stockwerke, Türen/Fenster, Dächer, Treppen, Möbelbibliothek, Grundstückseditor, Benutzerkonten und Cloud-Speicherung. Diese Funktionen werden in späteren Ausbaustufen ergänzt.

## Lokal starten
Du brauchst Node.js (LTS) und npm.

1. Entpacke den Projektordner.
2. Öffne ein Terminal im Projektordner.
3. Führe aus:

```bash
npm install
npm run dev
```

4. Öffne die im Terminal angezeigte lokale Adresse (meist http://localhost:5173).

## Online veröffentlichen (Link für alle mit dem Link)
1. Erstelle ein GitHub-Konto und ein neues Repository namens `hausplaner`.
2. Lade den Inhalt dieses Projektordners in das Repository hoch.
3. Erstelle ein Vercel-Konto und wähle „Add New → Project“.
4. Verbinde dein GitHub-Repository.
5. Vercel erkennt Vite normalerweise automatisch. Build Command: `npm run build`; Output Directory: `dist`.
6. Klicke auf Deploy. Vercel erstellt eine öffentliche URL. Jeder, der den Link kennt, kann die Website öffnen.

Hinweis: „Jeder mit dem Link“ ist keine Zugangsbeschränkung. Die URL ist öffentlich erreichbar und kann weitergegeben werden. Es gibt in dieser Version noch keine Benutzerkonten oder private Projekt-Synchronisierung.

## Wichtiger Hinweis zur Speicherung
„Speichern“ legt das Projekt nur im lokalen Browser des jeweiligen Geräts ab. Der JSON-Export ermöglicht eine zusätzliche Sicherung. Cloud-Speicherung und geräteübergreifendes Öffnen sind noch nicht enthalten.
