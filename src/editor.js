// src/editor.js
import { DockManager } from './ui/dock/dock.js';
import './ui/dock/dock.css';

const root = document.getElementById('editor');
const dock = new DockManager(root, { withRight: true });

// Put your game canvas in the center
const canvas = document.createElement('canvas');
canvas.id = 'game-canvas';
dock.centerEl.appendChild(canvas);

// Make your existing resize routine point at this canvas
// (use your DPR-aware resize from earlier)
function resizeCanvas() {
    const dpr = devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Add LEFT dock panels
dock.leftTabs.addTab({
    id: 'sprites',
    title: 'Sprites',
    icon: '🖼️',
    active: true,
    mount(root) {
        root.innerHTML = `
      <div style="padding:8px">
        <input id="spriteFilter" placeholder="Filter…" />
        <div id="spriteGrid" style="margin-top:8px; display:grid; grid-template-columns:repeat(auto-fill,72px); gap:8px;"></div>
      </div>`;
        // TODO: render sprite thumbs into #spriteGrid
    },
});

dock.leftTabs.addTab({
    id: 'tiles',
    title: 'Tiles',
    icon: '🧱',
    mount(root) {
        root.innerHTML = `
      <div style="padding:8px; display:flex; gap:10px;">
        <canvas id="tilesetCanvas" width="256" height="256" style="border:1px solid #2a3040;border-radius:8px"></canvas>
        <div>
          <label>Brush Size</label>
          <select id="brush"><option>1×1</option><option>2×2</option><option>3×3</option></select>
          <div style="margin-top:8px"><button id="place">Place</button> <button id="erase">Erase</button></div>
        </div>
      </div>`;
    },
});

// Add RIGHT dock panels
dock.rightTabs.addTab({
    id: 'inspector',
    title: 'Inspector',
    icon: '🔍',
    mount(root) {
        root.innerHTML = `
      <div style="padding:10px">
        <h3 style="margin:0 0 8px;">Entity</h3>
        <div id="inspectorBody" style="font:12px/1.4 system-ui;">Select something…</div>
      </div>`;
    },
});

dock.rightTabs.addTab({
    id: 'animations',
    title: 'Animations',
    icon: '🎞️',
    mount(root) {
        root.innerHTML = `
      <div style="padding:10px">
        <button id="btnPlay">Play</button>
        <button id="btnPause">Pause</button>
        <div id="animPreview" style="height:160px;border:1px solid #2a3040;margin-top:8px;border-radius:8px;"></div>
      </div>`;
    },
});
