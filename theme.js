// Hell/Dunkel: merkt sich die Wahl; ohne Wahl startet die Seite immer im hellen Modus.
// Wird im <head> geladen, damit die Seite nicht kurz in der falschen Farbe aufblitzt.
(() => {
  const wurzel = document.documentElement;
  wurzel.classList.add('js'); // erlaubt Einblend-Effekte nur, wenn JavaScript läuft
  // Der Schalter zeigt, wohin ein Klick wechselt
  const texte = {
    en: { light: ['dark', 'Switch to dark mode'], dark: ['light', 'Switch to light mode'] },
    de: { light: ['dunkel', 'Zum dunklen Modus wechseln'], dark: ['hell', 'Zum hellen Modus wechseln'] },
  };
  const setzen = (modus) => {
    wurzel.dataset.theme = modus;
    const [text, label] = (texte[wurzel.lang] || texte.en)[modus];
    document.querySelectorAll('.modus').forEach((b) => { b.textContent = text; b.setAttribute('aria-label', label); });
  };
  let gespeichert = null;
  try { gespeichert = localStorage.getItem('modus'); } catch (e) {}
  setzen(gespeichert === 'dark' ? 'dark' : 'light');
  document.addEventListener('DOMContentLoaded', () => setzen(wurzel.dataset.theme));
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.modus')) return;
    const neu = wurzel.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('modus', neu); } catch (err) {}
    setzen(neu);
  });
})();
