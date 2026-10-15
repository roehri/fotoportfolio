# Fotoportfolio Martin Röhr

Statische Website (Englisch + Deutsch), ohne Framework.

## Arbeitsablauf

1. **Fotos**: in `bilder/` legen (JPG, PNG, WebP), dann

   ```bash
   node bilder-einlesen.mjs
   ```

   Erzeugt Vorschauen (`bilder/_klein`), Großansichten (`bilder/_gross`) und `bilder.js`.
   Neue Fotos am besten gleich nach dem Schema `martin-roehr-<thema>-berlin-001.jpg` benennen,
   daraus entstehen auch die Alt-Texte.

2. **Texte**: in `inhalt/en/` und `inhalt/de/` ändern. Titel und Beschreibungen für Suchmaschinen stehen oben in `bauen.mjs`.

3. **Bauen**:

   ```bash
   node bauen.mjs
   ```

   Erzeugt alle Seiten, `sitemap.xml`, `robots.txt`, `_redirects` und den Ordner `dist/`.

4. **Veröffentlichen**: committen und pushen – Cloudflare Pages baut und veröffentlicht automatisch.

   ```bash
   git add -A && git commit -m "Neue Fotos" && git push
   ```

## Cloudflare Pages (einmalig)

Pages-Projekt mit dem GitHub-Repo verbinden, dann:

- Framework preset: **None**
- Build command: **`node bauen.mjs`**
- Build output directory: **`dist`**

Die Fotos werden lokal verkleinert (das Skript braucht macOS); ins Repo kommen nur `bilder/_klein`,
`bilder/_gross` und `bilder.js`. Die Originalfotos und `umbenennung-alt-neu.json` bleiben lokal (siehe `.gitignore`).

## Dateien

| Datei | Zweck |
| --- | --- |
| `galerie.js` | endlose, laufende Galerie der Startseite |
| `einblenden.js` | sanftes Einblenden der Inhalte |
| `intro.js` | Ladeanimation der Contact-Seite |
| `theme.js` | hell/dunkel (Standard: hell) |
| `mail.js` | E-Mail-Adresse erst im Browser zusammensetzen (Schutz vor Crawlern) |
| `umbenennung-alt-neu.json` | alte → neue Fotonamen; enthält Model-Namen, nicht veröffentlichen |

Die HTML-Dateien im Hauptordner und in `de/` werden von `bauen.mjs` erzeugt – nicht direkt bearbeiten (sie stehen auch nicht im Repo).
