// Ein endloses Feld aus Reihen: in jeder Reihe liegen mal keine, mal ein paar Grüppchen
// aus 1–4 Bildern an zufälligen Stellen. Das Feld läuft von unten nach oben.
// Es besteht aus Abschnitten: Jeder Abschnitt zeigt alle Fotos genau einmal, in eigener Reihenfolge
// und mit eigenem Muster. Danach beginnt automatisch der nächste Abschnitt, also ein neues Muster.
(() => {
  const buehne = document.getElementById('buehne');
  const bilder = window.BILDER || [];
  if (!bilder.length) return; // nichts zu zeigen

  // ---------- Vollbild ----------
  const voll = document.createElement('div');
  voll.className = 'voll';
  const vollBild = document.createElement('img');
  vollBild.alt = '';
  voll.appendChild(vollBild);
  document.body.appendChild(voll);
  // das gezeigte Bild in der Galerie hervorheben (auch für Touch, wo es kein Hover gibt)
  const markieren = () => buehne.querySelectorAll('figure').forEach((f) => f.classList.toggle('aktiv', f.dataset.q === aktuell));
  let schliessTimer;
  let aktuell = null;
  const zeigeVoll = (src) => {
    clearTimeout(schliessTimer);
    aktuell = src;
    markieren();
    vollBild.src = src;
    voll.classList.add('offen');
    document.body.classList.add('vollbild');
  };
  // kurze Verzögerung, damit der Wechsel von Bild zu Bild nicht flackert
  const schliesseVoll = (sofort) => {
    clearTimeout(schliessTimer);
    schliessTimer = setTimeout(() => {
      aktuell = null;
      markieren();
      voll.classList.remove('offen');
      document.body.classList.remove('vollbild');
    }, sofort === true ? 0 : 180);
  };

  // ---------- Abschnitte ----------
  const ruhig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tempo = ruhig ? 8 : 30;     // Grundtempo in px/s (langsamer bei „Bewegung reduzieren“)
  let spur = null;
  let B = 0, H = 0, bh = 0, takt = 0;
  const luecke = 4;                 // Abstand innerhalb eines Grüppchens
  let cache = new Map();            // Abschnitt-Nr. -> { eintraege, hoehe }
  let starts = new Map([[0, 0]]);   // Abschnitt-Nr. -> Startposition (px)
  const dom = new Map();            // Abschnitt-Nr. -> Element

  // Zufall je Abschnitt: gleiche Nummer ergibt immer dasselbe Muster (auch beim Zurückscrollen)
  function zufallFuer(nr) {
    let seed = (Math.abs(nr) * 7919 + (nr < 0 ? 104729 : 11)) % 2147483646 + 1;
    for (let k = 0; k < 5; k++) seed = (seed * 16807) % 2147483647;
    const zufall = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    return { zufall, zahl: (a, b) => a + Math.floor(zufall() * (b - a + 1)) };
  }

  function abschnitt(nr) {
    if (cache.has(nr)) return cache.get(nr);
    const { zufall, zahl } = zufallFuer(nr);

    // alle Fotos einmal, in zufälliger Reihenfolge
    const stapel = bilder.slice();
    for (let i = stapel.length - 1; i > 0; i--) {
      const j = Math.floor(zufall() * (i + 1));
      [stapel[i], stapel[j]] = [stapel[j], stapel[i]];
    }

    const eintraege = [];
    let reihe = 0, leereFolge = 0;
    while (stapel.length) {
      let gruppen = [0, 1, 1, 2, 2, 3, 3, 4][zahl(0, 7)]; // manche Reihen fast leer
      if (gruppen === 0 && leereFolge >= 2) gruppen = 1;   // nie zu lange Leerlauf
      leereFolge = gruppen === 0 ? leereFolge + 1 : 0;
      const belegt = [];
      for (let g = 0; g < gruppen && stapel.length; g++) {
        const n = [1, 1, 2, 2, 3, 4][zahl(0, 5)];
        const gruppe = [];
        for (let k = 0; k < n && stapel.length; k++) gruppe.push(stapel.pop());
        const breiten = gruppe.map((b) => Math.round(bh * b.w / b.h));
        const gesamtBreite = () => breiten.reduce((a, b) => a + b, 0) + luecke * (breiten.length - 1);
        while (gruppe.length > 1 && gesamtBreite() >= B) { stapel.push(gruppe.pop()); breiten.pop(); }
        const gesamt = gesamtBreite();
        let x = null;
        for (let versuch = 0; versuch < 12 && x === null; versuch++) {
          const k = B > gesamt ? zahl(0, B - gesamt) : 0;
          if (belegt.every(([a, e]) => k + gesamt + 40 < a || k > e + 40)) x = k;
        }
        if (x === null) { gruppe.forEach((b) => stapel.push(b)); continue; } // landet in einer späteren Reihe
        belegt.push([x, x + gesamt]);
        let links = x;
        gruppe.forEach((b, i) => {
          eintraege.push({ b, links, oben: reihe * takt, breite: breiten[i] });
          links += breiten[i] + luecke;
        });
      }
      reihe++;
    }
    const a = { eintraege, hoehe: (reihe + 1) * takt };
    cache.set(nr, a);
    return a;
  }

  // Startposition eines Abschnitts: Höhen aller Abschnitte davor addiert
  function start(nr) {
    if (starts.has(nr)) return starts.get(nr);
    let s;
    if (nr > 0) { let k = Math.max(...[...starts.keys()].filter((x) => x >= 0 && x < nr)); s = starts.get(k); for (; k < nr; k++) { s += abschnitt(k).hoehe; starts.set(k + 1, s); } }
    else { let k = Math.min(...[...starts.keys()].filter((x) => x <= 0 && x > nr)); s = starts.get(k); for (; k > nr; k--) { s -= abschnitt(k - 1).hoehe; starts.set(k - 1, s); } }
    return starts.get(nr);
  }

  let ersterAufbau = true; // nur beim Öffnen der Seite sanft einblenden
  function aufbauen(nr) {
    const a = abschnitt(nr);
    const el = document.createElement('div');
    el.className = 'abschnitt';
    el.style.top = `${start(nr)}px`;
    if (nr !== 0) el.setAttribute('aria-hidden', 'true');
    a.eintraege.forEach(({ b, links, oben, breite }) => {
      const fig = document.createElement('figure');
      fig.style.cssText = `left:${links}px;top:${oben}px;width:${breite}px;height:${bh}px`;
      const quelle = b.voll || b.src;
      fig.dataset.q = quelle;
      if (quelle === aktuell) fig.classList.add('aktiv');
      const img = document.createElement('img');
      img.src = b.src;
      img.alt = (document.documentElement.lang === 'de' ? b.altDe : b.alt) || '';
      img.loading = 'lazy';
      fig.appendChild(img);
      // Maus: Drüberfahren öffnet, Wegfahren schließt
      fig.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') zeigeVoll(quelle); });
      fig.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') schliesseVoll(); });
      // Touch: Antippen öffnet, nochmal Antippen (oder daneben) schließt, anderes Bild tippen wechselt
      fig.addEventListener('click', (e) => {
        if (e.pointerType === 'mouse') return;
        e.stopPropagation();
        if (aktuell === quelle) schliesseVoll(true); else zeigeVoll(quelle);
      });
      el.appendChild(fig);
    });
    spur.appendChild(el);
    if (ersterAufbau && nr === 0 && document.documentElement.classList.contains('js') && !ruhig) {
      ersterAufbau = false;
      const sichtbar = [...el.children].filter((f) => parseFloat(f.style.top) < H);
      sichtbar.forEach((f, k) => { f.classList.add('rein'); f.style.setProperty('--d', `${Math.min(k, 36) * 0.03}s`); });
      requestAnimationFrame(() => requestAnimationFrame(() => sichtbar.forEach((f) => f.classList.add('sichtbar'))));
    }
    dom.set(nr, el);
  }

  let pos = 0;         // Position im endlosen Feld (px, darf auch negativ werden)
  let aktAbschnitt = 0;
  let schub = 0;       // Zusatzgeschwindigkeit durch Scrollen (px/s)

  function bauen() {
    buehne.innerHTML = '';
    cache = new Map();
    starts = new Map([[0, 0]]);
    dom.clear();
    B = buehne.clientWidth;
    H = window.innerHeight;
    bh = Math.max(96, Math.min(210, H * 0.16));   // Bildhöhe
    takt = bh * 1.3;                              // Reihenabstand
    spur = document.createElement('div');
    spur.className = 'spur';
    buehne.appendChild(spur);
    pos = 0;
    aktAbschnitt = 0;
    ersterAufbau = true;
  }

  // Es werden immer nur der aktuelle und der nächste Abschnitt gezeichnet
  function abschnitteAktualisieren() {
    while (pos >= start(aktAbschnitt) + abschnitt(aktAbschnitt).hoehe) aktAbschnitt++;
    while (pos < start(aktAbschnitt)) aktAbschnitt--;
    const gebraucht = [aktAbschnitt, aktAbschnitt + 1];
    for (const nr of gebraucht) if (!dom.has(nr)) aufbauen(nr);
    for (const [nr, el] of dom) if (!gebraucht.includes(nr)) { el.remove(); dom.delete(nr); }
  }

  bauen();
  let breite = window.innerWidth, hoehe = window.innerHeight, timer;
  window.addEventListener('resize', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (window.innerWidth !== breite || window.innerHeight !== hoehe) {
        breite = window.innerWidth; hoehe = window.innerHeight; bauen();
      }
    }, 200);
  });

  // Touch: Tippen auf freie Fläche schließt das offene Bild
  buehne.addEventListener('click', (e) => { if (e.pointerType !== 'mouse' && aktuell) schliesseVoll(true); });

  // Scrollen beschleunigt (oder bremst/kehrt um); der Schub klingt von selbst ab
  const stoss = (d) => { schub = Math.max(-4000, Math.min(4000, schub + d * 6)); };
  window.addEventListener('wheel', (e) => { e.preventDefault(); stoss(e.deltaY); }, { passive: false });
  let ty = null;
  window.addEventListener('touchstart', (e) => { ty = e.touches[0].clientY; }, { passive: true });
  window.addEventListener('touchmove', (e) => {
    const y = e.touches[0].clientY; if (ty !== null) stoss((ty - y) * 3); ty = y;
  }, { passive: true });

  let zuletzt = performance.now();
  function lauf(jetzt) {
    const dt = Math.min(0.05, (jetzt - zuletzt) / 1000);
    zuletzt = jetzt;
    const langsam = document.body.classList.contains('vollbild') ? 0.35 : 1; // läuft bei offenem Bild leise weiter
    schub *= Math.pow(0.04, dt); // Abklingen
    pos += (tempo * langsam + schub) * dt;
    abschnitteAktualisieren();
    spur.style.transform = `translate3d(0, ${-pos}px, 0)`;
    requestAnimationFrame(lauf);
  }
  requestAnimationFrame(lauf);
})();
