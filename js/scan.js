import { loadData, h, initChrome, checklist, loadScript, VENDOR, inAppBrowser } from './app.js';

const TARGET_FILE = 'targets/cards.mind';
const CARD_FILL = 0.6; // bird length as a share of the card width (card width = 1 unit in MindAR)

const startButton = document.getElementById('start');
const message = document.getElementById('scan-message');
const stage = document.getElementById('scan-stage');
const statusEl = document.getElementById('scan-status');

function fail(text) {
  message.textContent = text;
  message.hidden = false;
  stage.hidden = true;
  stage.replaceChildren();
  document.getElementById('scan-top').hidden = true;
  document.getElementById('scan-bottom').hidden = true;
  document.body.classList.remove('scan-active');
  startButton.disabled = false;
  startButton.textContent = 'Try again';
}

function setStatus(...content) {
  statusEl.replaceChildren(...content);
}

function buildScene(species) {
  // A-Frame parses entities as they are attached, so build the scene as markup in one go.
  const targets = species.map((s) => {
    const scale = (CARD_FILL / s.model.length_m).toFixed(4);
    // rotation 90 on X: the model's "up" becomes "out of the card", so the bird stands on it.
    return `
      <a-entity mindar-image-target="targetIndex: ${s.card.target_index}" data-species="${s.id}">
        <a-gltf-model src="${s.model.src}" rotation="90 0 0" scale="${scale} ${scale} ${scale}"></a-gltf-model>
      </a-entity>`;
  }).join('');

  stage.innerHTML = `
    <a-scene
      mindar-image="imageTargetSrc: ${TARGET_FILE}; maxTrack: 1; uiLoading: no; uiScanning: no; uiError: no; filterMinCF: 0.001; filterBeta: 0.01"
      vr-mode-ui="enabled: false"
      device-orientation-permission-ui="enabled: false"
      renderer="colorManagement: true; antialias: true; alpha: true">
      <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>
      <a-entity light="type: ambient; intensity: 0.5"></a-entity>
      <a-entity light="type: directional; intensity: 0.9" position="-0.5 1 1.5"></a-entity>
      ${targets}
    </a-scene>`;
  return stage.querySelector('a-scene');
}

async function start(data) {
  message.hidden = true;

  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    return fail(inAppBrowser()
      ? 'This in-app browser blocks the camera. Open this page in Safari or Chrome and try again.'
      : 'The camera is not available here. This page must be opened over HTTPS in Safari or Chrome.');
  }

  startButton.disabled = true;
  startButton.textContent = 'Loading…';

  try {
    // Loaded only now, in order: MindAR registers itself on the AFRAME global.
    await loadScript(VENDOR.aframe);
    await loadScript(VENDOR.mindar);
  } catch {
    return fail('The AR library could not load. Check your connection and try again.');
  }

  stage.hidden = false;
  document.getElementById('scan-top').hidden = false;
  document.getElementById('scan-bottom').hidden = false;
  document.body.classList.add('scan-active');
  setStatus('Starting camera…');

  const scene = buildScene(data.species);

  scene.addEventListener('arReady', () => {
    setStatus('Point your camera at the picture on a species card.');
  });
  scene.addEventListener('arError', () => {
    fail('We could not start the camera. Allow camera access for this site in your browser settings, then try again.');
  });

  scene.querySelectorAll('[mindar-image-target]').forEach((target) => {
    const species = data.species.find((s) => s.id === target.dataset.species);
    target.addEventListener('targetFound', () => {
      checklist.add(species.id); // "found" = its AR view was launched
      setStatus(
        h('strong', {}, `${species.common_name} found!`), h('br'),
        h('a', { href: `species.html?id=${encodeURIComponent(species.id)}` }, 'Open its species card'));
    });
    target.addEventListener('targetLost', () => {
      setStatus('Point your camera at the picture on a species card.');
    });
  });
}

async function init() {
  initChrome();
  const data = await loadData();
  startButton.addEventListener('click', () => start(data));
}

init().catch((err) => fail(err.message));
