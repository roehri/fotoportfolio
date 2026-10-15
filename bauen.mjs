// Baut alle Seiten (Englisch + Deutsch) aus den Inhalten in inhalt/<sprache>/<seite>.html,
// dazu sitemap.xml, robots.txt und _redirects. Aufruf:  node bauen.mjs
// Texte ändern: die Dateien in inhalt/ bearbeiten (oder Titel/Beschreibungen unten), dann neu bauen.
import fs from 'node:fs';
import path from 'node:path';

const wurzel = path.dirname(new URL(import.meta.url).pathname);
const SITE = 'https://martin-roehr.com';
const JAHR = 2026;
const STAND = '2026-10-15';

const sprachen = {
  en: {
    lang: 'en', locale: 'en_US', praefix: '',
    nav: { home: 'Home', about: 'About', contact: 'Contact' },
    recht: { imprint: 'Legal notice', privacy: 'Privacy' },
    wechsel: 'de', wechselTitel: 'Deutsche Version',
  },
  de: {
    lang: 'de', locale: 'de_DE', praefix: '/de',
    nav: { home: 'Start', about: 'Über mich', contact: 'Kontakt' },
    recht: { imprint: 'Impressum', privacy: 'Datenschutz' },
    wechsel: 'en', wechselTitel: 'English version',
  },
};

// Seiten: Adresse je Sprache, Titel, Beschreibung, Skripte
const seiten = {
  home: {
    pfad: { en: '/', de: '/de/' }, teil: 'home', body: 'galerie',
    titel: { en: 'Martin Röhr – Portrait & Music Photography, Berlin', de: 'Martin Röhr – Portrait- & Musikfotografie, Berlin' },
    text: {
      en: 'Martin Röhr is a photographer based in Berlin with a focus on portrait and music photography – raw, real and natural. Selected work and references.',
      de: 'Martin Röhr ist Fotograf in Berlin mit Schwerpunkt Portrait- und Musikfotografie – roh, echt und natürlich. Ausgewählte Arbeiten und Referenzen.',
    },
    skripte: ['bilder.js', 'galerie.js'],
  },
  about: {
    pfad: { en: '/about', de: '/de/ueber-mich' }, teil: 'about',
    titel: { en: 'About – Martin Röhr, Photographer in Berlin', de: 'Über mich – Martin Röhr, Fotograf in Berlin' },
    text: {
      en: 'About Martin Röhr: photographer in Berlin focusing on portrait and music photography. Published in magazines and worked with artists such as Paul Kalkbrenner, Kid Simius and Chefket.',
      de: 'Über Martin Röhr: Fotograf in Berlin mit Schwerpunkt Portrait- und Musikfotografie. Veröffentlicht in Magazinen, Arbeiten mit Artists wie Paul Kalkbrenner, Kid Simius und Chefket.',
    },
    skripte: ['mail.js', 'einblenden.js'], person: true,
  },
  contact: {
    pfad: { en: '/contact', de: '/de/kontakt' }, teil: 'contact', intro: true,
    titel: { en: 'Contact – Martin Röhr', de: 'Kontakt – Martin Röhr' },
    text: {
      en: 'Get in touch with Martin Röhr, photographer in Berlin – by e-mail or Instagram.',
      de: 'Kontakt zu Martin Röhr, Fotograf in Berlin – per E-Mail oder Instagram.',
    },
    skripte: ['mail.js', 'bilder.js', 'einblenden.js', 'intro.js'],
  },
  imprint: {
    pfad: { en: '/imprint', de: '/de/impressum' }, teil: 'imprint', recht: true,
    titel: { en: 'Legal notice – Martin Röhr', de: 'Impressum – Martin Röhr' },
    text: { en: 'Legal notice of martin-roehr.com.', de: 'Impressum von martin-roehr.com.' },
    skripte: ['mail.js', 'einblenden.js'],
  },
  privacy: {
    pfad: { en: '/privacy', de: '/de/datenschutzerklaerung' }, teil: 'privacy', recht: true,
    titel: { en: 'Privacy policy – Martin Röhr', de: 'Datenschutzerklärung – Martin Röhr' },
    text: { en: 'Privacy policy of martin-roehr.com.', de: 'Datenschutzerklärung von martin-roehr.com.' },
    skripte: ['mail.js', 'einblenden.js'],
  },
};

const datei = (pfad) => (pfad.endsWith('/') ? pfad + 'index.html' : pfad + '.html').replace(/^\//, '');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function strukturdaten(s, lg) {
  const person = {
    '@type': 'Person', '@id': `${SITE}/#martin`, name: 'Martin Röhr', jobTitle: lg === 'de' ? 'Fotograf' : 'Photographer',
    url: SITE + '/', image: `${SITE}/martin.jpg`,
    sameAs: ['https://www.instagram.com/martin_roehr/'],
    address: { '@type': 'PostalAddress', addressLocality: 'Berlin', addressCountry: 'DE' },
    knowsAbout: lg === 'de' ? ['Portraitfotografie', 'Musikfotografie'] : ['Portrait photography', 'Music photography'],
  };
  if (s === seiten.home) {
    return { '@context': 'https://schema.org', '@graph': [
      { '@type': 'WebSite', '@id': `${SITE}/#website`, url: SITE + '/', name: 'Martin Röhr', inLanguage: ['en', 'de'] }, person] };
  }
  if (s.person) {
    return { '@context': 'https://schema.org', '@type': 'ProfilePage', mainEntity: person };
  }
  return null;
}

function seite(schluessel, lg) {
  const s = seiten[schluessel], L = sprachen[lg], andere = sprachen[L.wechsel];
  const url = SITE + s.pfad[lg];
  const teil = fs.readFileSync(path.join(wurzel, 'inhalt', lg, s.teil + '.html'), 'utf8');
  const sd = strukturdaten(s, lg);
  const alternativen = ['en', 'de'].map((x) => `<link rel="alternate" hreflang="${x}" href="${SITE + s.pfad[x]}">`).join('\n')
    + `\n<link rel="alternate" hreflang="x-default" href="${SITE + s.pfad.en}">`;
  const nav = (k, p) => `<a href="${seiten[p].pfad[lg]}"${schluessel === p ? ' aria-current="page"' : ''}>${L.nav[k]}</a>`;
  const skripte = s.skripte.map((f) => `<script src="/${f}"></script>`).join('\n');

  return `<!doctype html>
<html lang="${L.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(s.titel[lg])}</title>
<meta name="description" content="${esc(s.text[lg])}">
<meta name="author" content="Martin Röhr">
<link rel="canonical" href="${url}">
${alternativen}
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#030206" media="(prefers-color-scheme: dark)">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Martin Röhr">
<meta property="og:title" content="${esc(s.titel[lg])}">
<meta property="og:description" content="${esc(s.text[lg])}">
<meta property="og:url" content="${url}">
<meta property="og:locale" content="${L.locale}">
<meta property="og:locale:alternate" content="${andere.locale}">
<meta property="og:image" content="${SITE}/og-image.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/fonts/instrument-sans-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/style.css">
<script src="/theme.js"></script>${sd ? `\n<script type="application/ld+json">${JSON.stringify(sd)}</script>` : ''}
</head>
<body${s.body ? ` class="${s.body}"` : ''}>
${s.intro ? '<div class="intro" aria-hidden="true"><div class="intro-bild"><img alt=""></div></div>\n<noscript><style>.intro{display:none}</style></noscript>\n' : ''}
<header class="kopf">
  <a class="logo" href="${seiten.home.pfad[lg]}">Martin Röhr</a>
  <nav>
    ${nav('home', 'home')}
    ${nav('about', 'about')}
    ${nav('contact', 'contact')}
  </nav>
  <div class="rechts">
    <a class="sprache" href="${s.pfad[L.wechsel]}" hreflang="${L.wechsel}" lang="${L.wechsel}" title="${L.wechselTitel}">${L.wechsel}</a>
    <button class="modus" type="button"></button>
  </div>
</header>

${teil.trim()}

<footer class="fuss">
  <span>© ${JAHR} Martin Röhr</span>
  <nav aria-label="Legal">
    <a href="${seiten.imprint.pfad[lg]}">${L.recht.imprint}</a>
    <a href="${seiten.privacy.pfad[lg]}">${L.recht.privacy}</a>
  </nav>
</footer>

${skripte}
</body>
</html>
`;
}

// Seiten schreiben
let anzahl = 0;
for (const k of Object.keys(seiten)) {
  for (const lg of ['en', 'de']) {
    const ziel = path.join(wurzel, datei(seiten[k].pfad[lg]));
    fs.mkdirSync(path.dirname(ziel), { recursive: true });
    fs.writeFileSync(ziel, seite(k, lg));
    anzahl++;
  }
}

// Sitemap mit Sprachverweisen
const eintraege = [];
for (const k of Object.keys(seiten)) {
  for (const lg of ['en', 'de']) {
    const s = seiten[k];
    eintraege.push(`  <url>
    <loc>${SITE + s.pfad[lg]}</loc>
    <lastmod>${STAND}</lastmod>
    <xhtml:link rel="alternate" hreflang="en" href="${SITE + s.pfad.en}"/>
    <xhtml:link rel="alternate" hreflang="de" href="${SITE + s.pfad.de}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE + s.pfad.en}"/>
  </url>`);
  }
}
fs.writeFileSync(path.join(wurzel, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${eintraege.join('\n')}
</urlset>
`);
fs.writeFileSync(path.join(wurzel, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

// Fehlerseite: ohne 404.html würde Cloudflare Pages bei unbekannten Adressen die Startseite zeigen
fs.writeFileSync(path.join(wurzel, '404.html'), `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Page not found – Martin Röhr</title>
<meta name="robots" content="noindex">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/style.css">
<script src="/theme.js"></script>
</head>
<body>
<header class="kopf">
  <a class="logo" href="/">Martin Röhr</a>
  <div class="rechts"><button class="modus" type="button"></button></div>
</header>
<main class="kontakt">
  <h1 class="mail" style="font-weight: 400">404</h1>
  <p>This page doesn’t exist. · Diese Seite gibt es nicht.</p>
  <p><a href="/">→ home</a> &nbsp; <a href="/de/">→ start</a></p>
</main>
</body>
</html>
`);

// Zwischenspeicher-Regeln für Cloudflare: Schriften lange, Bilder eine Woche, Seiten immer frisch prüfen
fs.writeFileSync(path.join(wurzel, '_headers'), `/fonts/*
  Cache-Control: public, max-age=31536000, immutable
/bilder/*
  Cache-Control: public, max-age=604800
/*.html
  Cache-Control: public, max-age=0, must-revalidate
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
`);

// Weiterleitungen (Cloudflare Pages): alte Adressen der bisherigen Seite
fs.writeFileSync(path.join(wurzel, '_redirects'), `# Alte Adressen der bisherigen Website
/datenschutzerklaerung   /de/datenschutzerklaerung   301
/random                  /                           301
/barrierefreiheit        /                           301
/ueber-mich              /de/ueber-mich              301
/kontakt                 /de/kontakt                 301
/impressum               /de/impressum               301
/datenschutzerklaerung/  /de/datenschutzerklaerung   301
/random/                 /                           301
/barrierefreiheit/       /                           301
/about/                  /about                      301
/contact/                /contact                    301
/imprint/                /imprint                    301
`);
// Auslieferungsordner dist/: nur das, was ins Netz gehört (keine Originale, keine Notizen)
const dist = path.join(wurzel, 'dist');
fs.rmSync(dist, { recursive: true, force: true });
const kopieren = (rel) => {
  const von = path.join(wurzel, rel);
  if (!fs.existsSync(von)) return;
  fs.mkdirSync(path.dirname(path.join(dist, rel)), { recursive: true });
  fs.cpSync(von, path.join(dist, rel), { recursive: true });
};
for (const k of Object.keys(seiten)) for (const lg of ['en', 'de']) kopieren(datei(seiten[k].pfad[lg]));
['style.css', 'theme.js', 'bilder.js', 'galerie.js', 'mail.js', 'einblenden.js', 'intro.js', 'fonts', 'martin.jpg',
  'og-image.jpg', 'favicon.svg', 'robots.txt', 'sitemap.xml', '_redirects', '_headers', '404.html', 'bilder/_klein', 'bilder/_gross'].forEach(kopieren);
console.log(`${anzahl} Seiten gebaut, sitemap.xml, robots.txt und _redirects geschrieben; Auslieferungsordner dist/ aktualisiert.`);
