import {
  loadData, byId, param, h, initChrome, checklist, showError,
  loadScript, VENDOR, qrSvg, absoluteUrl, isLocalHost,
} from './app.js';

const AR_LABEL = 'See this bird in your space';

function foundTag(id) {
  const tag = h('span', { class: 'tag tag-found', role: 'status' });
  const update = () => {
    tag.textContent = checklist.has(id) ? '✓ Found' : '';
    tag.hidden = !checklist.has(id);
  };
  update();
  document.addEventListener('checklist-change', update);
  return tag;
}

// Build <model-viewer> only once the viewer is near the viewport, so the
// 1 MB library and the model never load for visitors who don't scroll to it.
function setupViewer(species, viewer, below) {
  const status = viewer.querySelector('.viewer-status');

  const start = async () => {
    try {
      await loadScript(VENDOR.modelViewer, { module: true });
      await customElements.whenDefined('model-viewer');
    } catch {
      status.textContent = 'The 3D viewer could not load. Check your connection and reload.';
      return;
    }

    const arButton = h('button', { slot: 'ar-button', class: 'btn btn-primary ar-button', type: 'button' }, AR_LABEL);
    const mv = h('model-viewer', {
      src: species.model.src,
      alt: species.model.alt,
      ar: true,
      'ar-modes': 'webxr scene-viewer quick-look',
      'ar-scale': 'fixed', // life size: the .glb is authored in meters at true scale
      'camera-controls': true,
      'disable-zoom': true, // keep wheel and pinch for scrolling the page
      'auto-rotate': true,
      'camera-orbit': '-30deg 78deg 150%', // pulled back so the AR button never covers the bird
      'touch-action': 'pan-y',
      'shadow-intensity': '1',
      'interaction-prompt': 'auto',
    }, arButton);
    // No ios-src on purpose: model-viewer generates the USDZ for Quick Look on iPhone.

    // "Found" = the visitor launched the AR view.
    arButton.addEventListener('click', () => checklist.add(species.id));

    mv.addEventListener('load', () => {
      status.remove();
      showArState(mv, species, below);
    });
    mv.addEventListener('error', () => {
      status.textContent = 'The 3D model could not load.';
    });
    mv.addEventListener('ar-status', (event) => {
      if (event.detail.status === 'failed') {
        below.querySelector('[data-ar-note]')?.replaceChildren(
          'AR could not start on this device. You can still rotate the 3D model above.');
      }
    });
    viewer.append(mv);
  };

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        start();
      }
    }, { rootMargin: '200px' });
    io.observe(viewer);
  } else {
    start();
  }
}

async function showArState(mv, species, below) {
  if (mv.canActivateAR) {
    below.replaceChildren(
      h('p', { class: 'muted small viewer-help', 'data-ar-note': true },
        `Tapping "${AR_LABEL}" opens your camera so the bird can appear in front of you at life size. Nothing is recorded or uploaded.`));
    return;
  }
  // Desktop or a phone without AR: rotatable model + QR code to continue on a phone.
  const url = absoluteUrl(`species.html?id=${encodeURIComponent(species.id)}`);
  const qr = await qrSvg(url, `QR code that opens the ${species.common_name} page on your phone`);
  below.replaceChildren(
    h('div', { class: 'panel qr-panel' },
      qr,
      h('div', { class: 'text' },
        h('h3', {}, 'See it at life size on your phone'),
        h('p', {}, 'AR is not available in this browser. Drag the model above to rotate it, or scan this code with your phone camera to place the bird in your space.'),
        isLocalHost() && h('p', { class: 'muted small' }, 'Heads up: this code points to localhost, so it only works once the site is deployed or opened through an HTTPS tunnel.'))));
}

async function init() {
  initChrome();
  const data = await loadData();
  const species = byId(data.species, param('id'));
  if (!species) return showError('We could not find that bird.');

  document.title = `${species.common_name} | Visit Fallon Birding Map (prototype)`;
  const locations = species.location_ids.map((id) => byId(data.locations, id)).filter(Boolean);

  const viewer = h('div', { class: 'viewer' },
    h('p', { class: 'viewer-status', role: 'status' }, 'Loading 3D model…'));
  const below = h('div', { class: 'viewer-below' });

  document.querySelector('main').replaceChildren(
    h('nav', { class: 'breadcrumb', 'aria-label': 'Breadcrumb' },
      h('a', { href: 'index.html' }, '‹ Back to the map')),
    h('p', { class: 'eyebrow' }, 'Species card'),
    h('h1', {}, species.common_name, ' ', foundTag(species.id)),
    h('p', {}, h('em', { class: 'sci' }, species.scientific_name)),

    h('figure', { class: 'photo' },
      h('img', { src: species.photo.src, alt: species.photo.alt, width: 900, height: 1200 }),
      species.photo.is_placeholder && h('figcaption', { class: 'tag tag-placeholder' }, 'Photo placeholder')),

    h('p', { class: 'lede' }, species.summary),

    h('h2', { id: 'model-heading' }, 'See it in 3D'),
    viewer,
    below,
    species.model.is_placeholder && h('p', { class: 'small' },
      h('span', { class: 'tag tag-placeholder' }, 'Stand-in model'),
      ` A sample duck, scaled to the real bird's length (${species.model.length_m} m).`),

    h('h2', {}, 'How to spot it'),
    h('div', { class: 'panel' },
      h('ul', { class: 'tips' }, species.id_tips.map((tip) => h('li', {}, tip)))),

    h('div', { class: 'panel' },
      h('dl', { class: 'facts' },
        h('div', {}, h('dt', {}, 'Habitat'), h('dd', {}, species.habitat)),
        h('div', {}, h('dt', {}, 'Best season'), h('dd', {}, species.best_season)),
        h('div', {}, h('dt', {}, 'Where to find it'),
          h('dd', {}, species.where_to_find),
          h('dd', {}, locations.map((loc, i) => [
            i > 0 && ' · ',
            h('a', { href: `location.html?id=${encodeURIComponent(loc.id)}` }, loc.name),
          ]))))),

    h('h2', {}, 'Have the printed card?'),
    h('p', {}, 'Point your camera at the card and the bird will stand on it.'),
    h('div', { class: 'btn-row' },
      h('a', { class: 'btn btn-primary', href: 'scan.html' }, 'Scan a printed card'),
      h('a', { class: 'btn', href: `card.html?id=${encodeURIComponent(species.id)}` }, 'Print this card')),

    h('p', { class: 'muted small' },
      'Species facts are placeholder copy. Source for the final build: ',
      h('a', { href: species.source_url, rel: 'noopener' }, 'Nevada Department of Wildlife species information'), '.'),
  );

  setupViewer(species, viewer, below);
}

init().catch((err) => showError(err.message));
