import { loadData, byId, param, h, initChrome, checklist, showError } from './app.js';

async function init() {
  initChrome();
  const data = await loadData();
  const loc = byId(data.locations, param('id'));
  if (!loc) return showError('We could not find that birding location.');

  document.title = `${loc.name} | Visit Fallon Birding Map (prototype)`;
  const species = loc.species_ids.map((id) => byId(data.species, id)).filter(Boolean);

  document.querySelector('main').replaceChildren(
    h('nav', { class: 'breadcrumb', 'aria-label': 'Breadcrumb' },
      h('a', { href: 'index.html' }, '‹ Back to the map')),
    h('p', { class: 'eyebrow' }, 'Birding location'),
    h('h1', {}, loc.name),
    loc.is_placeholder && h('p', {}, h('span', { class: 'tag tag-placeholder' }, 'Placeholder location and copy')),
    h('p', { class: 'lede' }, loc.description),
    h('div', { class: 'panel' },
      h('dl', { class: 'facts' },
        h('div', {}, h('dt', {}, 'Best season'), h('dd', {}, loc.best_season)),
        h('div', {}, h('dt', {}, 'Access'), h('dd', {}, loc.access_notes))),
    ),
    h('p', {},
      h('a', {
        class: 'btn',
        href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.directions_query)}`,
        rel: 'noopener',
      }, 'Get directions')),
    h('h2', { id: 'species-heading' }, 'Birds to look for here'),
    h('ul', { class: 'link-list', 'aria-labelledby': 'species-heading' },
      species.map((s) => h('li', {},
        h('a', { class: 'link-card', href: `species.html?id=${encodeURIComponent(s.id)}` },
          h('img', { src: s.photo.src, alt: '', width: 56, height: 56, loading: 'lazy' }),
          h('span', { class: 'body' },
            h('span', { class: 'title' }, s.common_name),
            h('span', { class: 'sub' }, h('em', {}, s.scientific_name), ` · ${s.best_season}`)),
          checklist.has(s.id) && h('span', { class: 'tag tag-found' }, 'Found'),
          h('span', { class: 'chev', 'aria-hidden': 'true' }, '›'))))),
  );
}

init().catch((err) => showError(err.message));
