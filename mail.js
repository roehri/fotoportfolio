// Setzt E-Mail-Adressen erst im Browser zusammen, damit sie nicht im Quelltext stehen (Schutz vor Adress-Crawlern).
// Im HTML steht die Adresse rückwärts in data-m, z. B. <a data-m="moc.rheor-nitram@olleh"></a>
document.querySelectorAll('a[data-m]').forEach((a) => {
  const adresse = [...a.dataset.m].reverse().join('');
  a.href = 'mailto:' + adresse;
  const ziel = a.querySelector('.adr') || a;
  ziel.textContent = adresse;
});
