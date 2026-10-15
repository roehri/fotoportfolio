// Kurze Ladeanimation beim Öffnen der Contact-Seite: ein paar Fotos blitzen klein in der Mitte auf,
// dann öffnet sich die Seite. Ohne JavaScript oder bei „Bewegung reduzieren“ wird sie übersprungen.
(() => {
  const hulle = document.querySelector('.intro');
  if (!hulle) return;
  const bilder = window.BILDER || [];
  const ende = () => { hulle.classList.add('weg'); document.dispatchEvent(new Event('intro-fertig')); setTimeout(() => hulle.remove(), 400); };
  if (!bilder.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return ende();

  const anzahl = Math.min(9, bilder.length);
  const auswahl = bilder.slice().sort(() => Math.random() - 0.5).slice(0, anzahl);
  const img = hulle.querySelector('img');

  // Vorschaubilder vorab laden, damit beim Aufblitzen nichts leer bleibt
  const geladen = auswahl.map((b) => { const i = new Image(); i.src = b.src; return i.decode().catch(() => {}); });
  Promise.race([Promise.all(geladen), new Promise((r) => setTimeout(r, 600))]).then(() => {
    let n = 0;
    const takt = setInterval(() => {
      if (n >= auswahl.length) { clearInterval(takt); ende(); return; }
      img.src = auswahl[n++].src;
      img.style.opacity = 1;
    }, 75);
  });
})();
