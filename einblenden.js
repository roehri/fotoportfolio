// Blendet Inhalte nacheinander sanft ein: erst beim Laden, dann beim Hineinscrollen.
// Auf der Contact-Seite startet es erst, wenn die Ladeanimation durch ist.
(() => {
  const ziele = [];
  const sammeln = (selektor, verzoegerung) => {
    document.querySelectorAll(selektor).forEach((el, i) => {
      el.classList.add('rein');
      el.style.setProperty('--d', `${verzoegerung(i)}s`);
      ziele.push(el);
    });
  };
  sammeln('.portrait', () => 0);
  sammeln('.lead', () => 0.12);
  sammeln('.referenzen h2', () => 0);
  sammeln('.referenzen ul li', (i) => Math.min(i, 14) * 0.045);
  sammeln('.infos section', (i) => Math.min(i, 10) * 0.1);
  sammeln('.kontakt > p', () => 0);
  sammeln('.kontakt .mail', () => 0.1);
  sammeln('.recht > *', (i) => (i < 8 ? i * 0.07 : 0)); // die ersten nacheinander, der Rest beim Scrollen

  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    ziele.forEach((el) => el.classList.add('sichtbar'));
    return;
  }
  const zeigen = (el) => { el.classList.add('sichtbar'); beob.unobserve(el); };
  const beob = new IntersectionObserver((eintraege) => {
    eintraege.forEach((e) => { if (e.isIntersecting || e.boundingClientRect.top < 0) zeigen(e.target); });
  }, { threshold: 0.12, rootMargin: '0px 0px -4% 0px' });

  // Beim schnellen Springen übersprungene Elemente (oberhalb des Fensters) sofort einblenden
  let wartet = false;
  window.addEventListener('scroll', () => {
    if (wartet) return;
    wartet = true;
    requestAnimationFrame(() => {
      wartet = false;
      ziele.forEach((el) => { if (!el.classList.contains('sichtbar') && el.getBoundingClientRect().bottom < 0) zeigen(el); });
    });
  }, { passive: true });

  let gestartet = false;
  const los = () => { if (gestartet) return; gestartet = true; ziele.forEach((el) => beob.observe(el)); };
  if (document.querySelector('.intro')) {
    document.addEventListener('intro-fertig', los, { once: true });
    setTimeout(los, 4000); // Sicherheitsnetz, falls die Animation nicht durchläuft
  } else los();
})();
