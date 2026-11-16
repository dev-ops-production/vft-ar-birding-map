// Shared helpers for every page. Plain ES modules, no build step.

export const VENDOR = {
  modelViewer: 'vendor/model-viewer-4.4.0.min.js', // ES module
  aframe: 'vendor/aframe-1.5.0.min.js',
  mindar: 'vendor/mindar-image-aframe-1.2.5.prod.js',
  qrcode: 'vendor/qrcode-generator-1.4.4.js',
};

/* ---------- data ---------- */

let dataPromise;
export function loadData() {
  if (!dataPromise) {
    dataPromise = fetch('data/birds.json').then((r) => {
      if (!r.ok) throw new Error(`Could not load data/birds.json (${r.status})`);
      return r.json();
    });
  }
  return dataPromise;
}

export const byId = (list, id) => list.find((item) => item.id === id);
export const param = (name) => new URLSearchParams(location.search).get(name);

/* ---------- DOM ---------- */

// h('a', { href: '…', class: 'btn' }, 'Text', childNode)
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value === false || value == null) continue;
    if (key.startsWith('on')) el.addEventListener(key.slice(2), value);
    else el.setAttribute(key, value === true ? '' : value);
  }
  el.append(...children.flat().filter((c) => c != null && c !== false));
  return el;
}

export function showError(message) {
  const main = document.querySelector('main');
  main.replaceChildren(
    h('div', { class: 'notice notice-error', role: 'alert' },
      h('h1', {}, 'Something went wrong'),
      h('p', {}, message),
      h('p', {}, h('a', { href: 'index.html' }, 'Back to the map'))),
  );
}

/* ---------- lazy script loading ---------- */

const scripts = new Map();
export function loadScript(src, { module = false } = {}) {
  if (!scripts.has(src)) {
    scripts.set(src, new Promise((resolve, reject) => {
      const s = document.createElement('script');
      if (module) s.type = 'module';
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.append(s);
    }));
  }
  return scripts.get(src);
}

/* ---------- QR codes ---------- */

export async function qrSvg(url, label) {
  await loadScript(VENDOR.qrcode);
  const qr = window.qrcode(0, 'M');
  qr.addData(url);
  qr.make();
  const wrap = h('div', { class: 'qr', role: 'img', 'aria-label': label });
  wrap.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 4, scalable: true });
  return wrap;
}

export const absoluteUrl = (relative) => new URL(relative, location.href).href;
export const isLocalHost = () => ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);

/* ---------- "Birds I've found" checklist ---------- */

const KEY = 'vf-birds-found';
export const checklist = {
  get() {
    try {
      const value = JSON.parse(localStorage.getItem(KEY));
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  },
  has(id) {
    return this.get().includes(id);
  },
  add(id) {
    const found = this.get();
    if (found.includes(id)) return false;
    try {
      localStorage.setItem(KEY, JSON.stringify([...found, id]));
    } catch { /* private mode: the checklist just won't persist */ }
    document.dispatchEvent(new CustomEvent('checklist-change'));
    return true;
  },
  clear() {
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
    document.dispatchEvent(new CustomEvent('checklist-change'));
  },
};

export function progressText(data) {
  const ids = data.species.map((s) => s.id);
  const found = checklist.get().filter((id) => ids.includes(id)).length;
  return { found, total: ids.length, text: `${found} of ${ids.length}` };
}

/* ---------- in-app browsers (Instagram, Facebook) ---------- */

export function inAppBrowser() {
  if (param('inapp') === '1') return 'Instagram'; // demo/testing switch
  const ua = navigator.userAgent || '';
  if (/Instagram/i.test(ua)) return 'Instagram';
  if (/FBAN|FBAV|FB_IAB|FBIOS/i.test(ua)) return 'Facebook';
  return null;
}

function inAppBanner(app) {
  const isAndroid = /Android/i.test(navigator.userAgent);
  const browser = isAndroid ? 'Chrome' : 'Safari';
  const status = h('span', { class: 'inapp-status', role: 'status' });
  const copy = h('button', {
    type: 'button',
    class: 'btn btn-small',
    onclick: async () => {
      try {
        await navigator.clipboard.writeText(location.href);
        status.textContent = `Link copied. Paste it into ${browser}.`;
      } catch {
        status.textContent = 'Could not copy. Use the menu to open in your browser.';
      }
    },
  }, 'Copy link');
  const actions = h('p', { class: 'inapp-actions' }, copy);
  if (isAndroid) {
    const intent = `intent://${location.host}${location.pathname}${location.search}#Intent;scheme=https;package=com.android.chrome;end`;
    actions.prepend(h('a', { class: 'btn btn-small btn-primary', href: intent }, 'Open in Chrome'));
  }
  actions.append(status);
  return h('aside', { class: 'inapp-banner', 'aria-label': 'Open in your browser' },
    h('p', {},
      h('strong', {}, `Open in ${browser} to see birds in AR. `),
      `${app}'s built-in browser can block the camera and AR. Tap the `,
      h('span', { 'aria-label': 'three dots menu' }, '•••'),
      ` menu and choose "Open in ${isAndroid ? 'Chrome' : 'external browser'}".`),
    actions);
}

/* ---------- shared page chrome ---------- */

export async function initChrome() {
  const app = inAppBrowser();
  if (app) document.querySelector('.site-header').after(inAppBanner(app));

  const pill = document.querySelector('[data-progress]');
  if (pill) {
    const data = await loadData();
    const update = () => {
      const { found, total, text } = progressText(data);
      pill.textContent = `${text} found`;
      pill.setAttribute('aria-label', `Birds I've found: ${found} of ${total}. View checklist.`);
    };
    update();
    document.addEventListener('checklist-change', update);
  }
}
