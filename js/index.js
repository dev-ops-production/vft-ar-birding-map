import { loadData, h, initChrome, checklist, progressText, showError } from './app.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const svg = (tag, attrs = {}, ...children) => {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  el.append(...children);
  return el;
};

function mapPoint(location) {
  const { x, y } = location.map;
  const count = location.species_ids.length;
  const label = svg('text', { class: 'map-label', x, y: y + 20, 'text-anchor': 'middle' });
  label.textContent = location.map_label || location.name;
  return svg('a', {
    class: 'map-point',
    href: `location.html?id=${encodeURIComponent(location.id)}`,
    'aria-label': `${location.name}, ${count} ${count === 1 ? 'species' : 'species'}`,
  },
    // generous hit area + focus ring (r=26 is about 46px on a 360px-wide phone)
    svg('circle', { class: 'ring', cx: x, cy: y - 10, r: 26, 'pointer-events': 'all' }),
    svg('path', {
      class: 'pin',
      d: `M${x} ${y} C${x - 4} ${y - 9} ${x - 12} ${y - 14} ${x - 12} ${y - 22} A12 12 0 1 1 ${x + 12} ${y - 22} C${x + 12} ${y - 14} ${x + 4} ${y - 9} ${x} ${y} Z`,
    }),
    svg('circle', { class: 'pin-dot', cx: x, cy: y - 22, r: 4.5 }),
    label,
  );
}

function renderChecklist(data) {
  const { found, total, text } = progressText(data);
  document.getElementById('progress-line').replaceChildren(
    h('strong', {}, text),
    ` birds found${found === total ? '. You found them all!' : ''}`,
  );
  document.getElementById('checklist-list').replaceChildren(
    ...data.species.map((s) => {
      const isFound = checklist.has(s.id);
      return h('li', {},
        h('span', { class: `check${isFound ? ' is-found' : ''}`, 'aria-hidden': 'true' }, isFound ? '✓' : ''),
        h('a', { href: `species.html?id=${encodeURIComponent(s.id)}` }, s.common_name),
        h('span', { class: 'visually-hidden' }, isFound ? ' (found)' : ' (not found yet)'));
    }),
  );
}

async function init() {
  initChrome();
  const data = await loadData();

  document.getElementById('map-points').replaceChildren(...data.locations.map(mapPoint));

  document.getElementById('location-list').replaceChildren(
    ...data.locations.map((loc) => {
      const count = loc.species_ids.length;
      return h('li', {},
        h('a', { class: 'link-card', href: `location.html?id=${encodeURIComponent(loc.id)}` },
          h('span', { class: 'body' },
            h('span', { class: 'title' }, loc.name),
            h('span', { class: 'sub' }, `${count} featured ${count === 1 ? 'bird' : 'birds'} · ${loc.best_season}`)),
          h('span', { class: 'chev', 'aria-hidden': 'true' }, '›')));
    }),
  );

  renderChecklist(data);
  document.addEventListener('checklist-change', () => renderChecklist(data));
  document.getElementById('reset-checklist').addEventListener('click', () => checklist.clear());
}

init().catch((err) => showError(`${err.message}. If you opened this file directly, run a local web server instead (see README).`));
