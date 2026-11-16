import { loadData, byId, param, h, initChrome, showError, qrSvg, absoluteUrl, isLocalHost } from './app.js';

async function card(species) {
  const url = absoluteUrl(`species.html?id=${encodeURIComponent(species.id)}`);
  const qr = await qrSvg(url, `QR code that opens the ${species.common_name} page`);
  return h('article', { class: 'print-card' },
    // This image is the AR tracking target. Keep it unobstructed and undistorted.
    h('img', { class: 'art', src: species.card.art, alt: species.photo.alt, width: 900, height: 1200 }),
    h('div', { class: 'info' },
      h('div', { class: 'text' },
        h('h2', {}, species.common_name),
        h('p', {}, h('em', {}, species.scientific_name)),
        h('p', {}, h('strong', {}, '1. '), 'Scan the code to meet this bird.'),
        h('p', {}, h('strong', {}, '2. '), 'Tap "Scan a printed card" and point your camera at the picture.')),
      qr));
}

async function init() {
  initChrome();
  const data = await loadData();
  const id = param('id');
  const list = id ? [byId(data.species, id)].filter(Boolean) : data.species;
  if (!list.length) return showError('We could not find that card.');

  document.getElementById('cards').replaceChildren(...await Promise.all(list.map(card)));
  document.getElementById('all-cards').hidden = !id;
  document.getElementById('localhost-warning').hidden = !isLocalHost();
  document.getElementById('print').addEventListener('click', () => window.print());
}

init().catch((err) => showError(err.message));
