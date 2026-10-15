// Liest alle Fotos aus dem Ordner "bilder/" ein, erzeugt kleine Vorschauen (für das Raster)
// und größere Versionen (für die Vollansicht) und schreibt bilder.js.
//
//   node bilder-einlesen.mjs          einmal einlesen
//   node bilder-einlesen.mjs --watch  beobachtet den Ordner und liest bei Änderungen neu ein
//
// Originale bleiben unangetastet. Vorschauen/Große Versionen landen in bilder/_klein und bilder/_gross.
// Danach „node bauen.mjs“ ausführen, damit dist/ die neuen Bilder enthält.
// Benötigt macOS (nutzt das eingebaute "sips").
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const wurzel = path.dirname(new URL(import.meta.url).pathname);
const ordner = path.join(wurzel, 'bilder');
const klein = path.join(ordner, '_klein');
const gross = path.join(ordner, '_gross');
const endungen = /\.(jpe?g|png|webp)$/i;
const enc = (p) => p.split('/').map(encodeURIComponent).join('/');

// Pixelmaße lesen, dabei die EXIF-Drehung beachten (Hochformat-Fotos der Kamera)
function masse(datei) {
  const out = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', '-g', 'orientation', datei]).toString();
  const g = (k) => (out.match(new RegExp(k + ': (\\S+)')) || [])[1];
  let w = +g('pixelWidth'), h = +g('pixelHeight');
  const o = +g('orientation') || 1;
  if (o >= 5 && o <= 8) [w, h] = [h, w];
  return { w, h };
}

function verkleinern(von, nach, kante) {
  if (fs.existsSync(nach) && fs.statSync(nach).mtimeMs >= fs.statSync(von).mtimeMs) return;
  execFileSync('sips', ['-Z', String(kante), '-s', 'format', 'jpeg', '-s', 'formatOptions', '80', von, '--out', nach], { stdio: 'ignore' });
}

// Alt-Texte (für Suchmaschinen und Screenreader) aus dem Dateinamen ableiten
function altTexte(name) {
  const nr = parseInt((name.match(/-(\d+)\.jpg$/) || [])[1] || '0', 10);
  if (/music/.test(name)) return { alt: `Music photography by Martin Röhr, Berlin – photo ${nr}`, altDe: `Musikfotografie von Martin Röhr, Berlin – Foto ${nr}` };
  if (/travel/.test(name)) return { alt: `Travel photography from France by Martin Röhr – photo ${nr}`, altDe: `Reisefotografie aus Frankreich von Martin Röhr – Foto ${nr}` };
  return { alt: `Portrait photography by Martin Röhr, Berlin – photo ${nr}`, altDe: `Portraitfotografie von Martin Röhr, Berlin – Foto ${nr}` };
}

function einlesen() {
  fs.mkdirSync(klein, { recursive: true });
  fs.mkdirSync(gross, { recursive: true });
  const dateien = fs.readdirSync(ordner).filter((f) => endungen.test(f) && !f.startsWith('.')).sort();
  if (!dateien.length) { console.log('Keine Bilder in bilder/ gefunden – bilder.js bleibt unverändert.'); return; }

  const vergeben = new Set();
  const eintraege = dateien.map((f) => {
    const original = path.join(ordner, f);
    let name = f.replace(/\.[^.]+$/, '') + '.jpg';
    while (vergeben.has(name)) name = name.replace(/\.jpg$/, '_2.jpg'); // gleicher Name mit anderer Endung
    vergeben.add(name);
    verkleinern(original, path.join(klein, name), 500);
    verkleinern(original, path.join(gross, name), 2400);
    const { w, h } = masse(original);
    return { src: '/' + enc(`bilder/_klein/${name}`), voll: '/' + enc(`bilder/_gross/${name}`), w, h, ...altTexte(name) };
  });

  // Vorschauen von Fotos, die nicht mehr im Ordner liegen, entfernen
  for (const d of [klein, gross]) {
    for (const f of fs.readdirSync(d)) if (!vergeben.has(f)) fs.unlinkSync(path.join(d, f));
  }

  fs.writeFileSync(path.join(wurzel, 'bilder.js'),
    '// Wird von bilder-einlesen.mjs erzeugt – nicht von Hand ändern.\n' +
    'window.BILDER = ' + JSON.stringify(eintraege, null, 2) + ';\n');
  console.log(`${eintraege.length} Bilder eingelesen → bilder.js`);
}

einlesen();
if (process.argv.includes('--watch')) {
  let t;
  fs.watch(ordner, (_, f) => {
    if (!f || !endungen.test(f)) return;
    clearTimeout(t);
    t = setTimeout(() => { try { einlesen(); } catch (e) { console.error(e.message); } }, 800);
  });
  console.log('Beobachte bilder/ … (Strg+C zum Beenden)');
}
