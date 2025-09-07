import GameLoop from '@tenoch_code/tlaloopi';
// import { Vector } from 'vecti';
import { GameEngine } from './gameEngine/gameEngine';
import { CustomEvents } from './utils/enums';

import { Tabs } from './ui/tabs/tabs';
// import './ui/tabs/tabs-retro.css';

let ctx = document.getElementById('canvas').getContext('2d');
let gameEngine = new GameEngine('../assets/config.json', ctx);
const tabs = new Tabs(document.getElementById('tab-container'), { title: 'Editor' });

function resizeCanvas(canvas, ctx) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect(); // CSS pixels, fractional

    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));

    // Draw in CSS pixel units; prevents double-scaling.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener('resize', (e) => {
    resizeCanvas(canvas, ctx);
});
resizeCanvas(canvas, ctx);

// onload
$(async function () {
    $('#tab-container').draggable();
    $('#tab-container').draggable('option', 'cursor', 'grabbing');

    let gameLoop = new GameLoop(
        {
            fps: 120,
        },
        gameEngine.update.bind(gameEngine),
        gameEngine.render.bind(gameEngine),
        (timestamp, deltaTime) => {},
        (fps, numUpdateSteps) => {
            $('#logging').html('<p>FPS: ' + fps + ' Steps: ' + numUpdateSteps + '</p>');
        }
    );

    // Listen for the game stopped event and stop the game loop
    gameEngine.addEventListener(CustomEvents.GAME_STOPPED, () => {
        // console.log('the game was stopped');
        gameLoop.stop();
    });

    // Listen for the game started event and start the game loop
    gameEngine.addEventListener(CustomEvents.GAME_STARTED, () => {
        console.log('the game was started');
        gameLoop.start();
    });

    $('#start-btn').on('click', () => {
        // dispatch a custom started event
        gameEngine.dispatchEvent(new Event(CustomEvents.GAME_STARTED));
        gameEngine.start();
    });

    $('#end-btn').on('click', () => {
        gameEngine.stop();
    });

    $('#change-test-btn').on('click', () => {
        gameEngine.test.prop1 = 'has new text';
    });

    await gameEngine.init();
    gameEngine.dispatchEvent(new Event(CustomEvents.GAME_STARTED));
    gameEngine.start();

    // Sprites panel
    tabs.addTab({
        id: 'sprites',
        title: 'Sprites',
        icon: '🖼️',
        tooltip: 'Browse sprites',
        active: true,
        // closable: true,

        mount(root) {
            root.innerHTML = `
      <div class="panel-row">
        <div><label>Filter</label><input id="spriteFilter" placeholder="name"></div>
        <div id="spriteGrid" style="display:grid;grid-template-columns:repeat(auto-fill,72px);gap:8px;margin-top:10px;"></div>
      </div>`;
            // TODO: render your sprites here (thumbs into #spriteGrid)
        },
        onShow(root) {
            /* refresh if needed */
        },
    });

    // Animations panel
    tabs.addTab({
        id: 'animations',
        title: 'Animations',
        icon: '🎞️',
        tooltip: 'Browse animations',
        mount(root) {
            root.innerHTML = `
      <div>
        <button id="btnPlay">Play</button>
        <button id="btnPause">Pause</button>
        <div id="animPreview" style="height:160px;border:1px solid var(--ui-border);margin-top:8px;border-radius:8px;"></div>
      </div>`;
            // Hook your engine’s preview canvas here…
        },
    });

    tabs.addTab({
        id: 'actions',
        title: 'Actions',
        icon: '⚙️',
        tooltip: 'Browse actions',
        mount(root) {
            root.innerHTML = `
      <div>
        <button id="btnPlay">Play</button>
        <button id="btnPause">Pause</button>
        <div id="animPreview" style="height:160px;border:1px solid var(--ui-border);margin-top:8px;border-radius:8px;"></div>
      </div>`;
            // Hook your engine’s preview canvas here...
        },
    });

    // Test
    tabs.addTab({
        id: 'test',
        title: 'Test',
        icon: '💾',
        tooltip: 'Test',
        mount(root) {
            root.innerHTML = `
      <div>
        <button id="btnTest">Test</button>
        <div id="testPreview" style="height:160px;border:1px solid var(--ui-border);margin-top:8px;border-radius:8px;"></div>
      </div>`;
            // Hook your engine’s preview canvas here...
        },
        onShow(root) {
            /* refresh if needed */
        },
    });

    // Tiles panel
    tabs.addTab({
        id: 'tiles',
        title: 'Tiles',
        icon: '🧱',
        badge: 0,
        tooltip: 'Tile editor',
        mount(root) {
            root.innerHTML = `<div id="tileset" style="display:flex; gap:10px;">
      <canvas id="tilesetCanvas" width="256" height="256" style="border:1px solid var(--ui-border)"></canvas>
      <div>
        <label>Brush Size</label>
        <select id="brush"><option>1×1</option><option>2×2</option><option>3×3</option></select>
        <div style="margin-top:8px"><button id="place">Place</button> <button id="erase">Erase</button></div>
      </div>
    </div>`;
        },
    });

    // Listen to tab lifecycle if you need cross-module behavior
    tabs.addEventListener('tab:select', (e) => {
        // e.detail.id -> 'sprites' | 'animations' | 'tiles'
    });
});
