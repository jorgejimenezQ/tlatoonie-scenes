import GameLoop from '@tenoch_code/tlaloopi';
import { GameEngine } from './gameEngine/gameEngine';
import { CustomEvents } from './utils/enums';
import { Tabs } from './ui/tabs/tabs';
import { createTabs } from './ui/tabs/createTabs';

const debug = true;
let ctx = document.getElementById('canvas').getContext('2d');
let gameEngine = new GameEngine('../assets/config.json', ctx, debug);

function resizeCanvas(canvas, ctx) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect(); // CSS pixels, fractional

    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));

    // Draw in CSS pixel units; prevents double-scaling.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener('resize', (e) => {
    gameEngine.dispatchEvent(new CustomEvent(CustomEvents.WINDOW_RESIZED));
    resizeCanvas(canvas, ctx);
});
resizeCanvas(canvas, ctx);

// onload
$(async function () {
    $('#tab-container').draggable();
    await startGame();
});

async function startGame() {
    let gameLoop = new GameLoop(
        {
            fps: 120,
        },
        gameEngine.fixedUpdate.bind(gameEngine),
        gameEngine.render.bind(gameEngine),
        (timestamp, delta) => {},
        (stats) => {
            // all values in ms
            // stats: { fps, fixedDt, elapsedTime, simulatedTime, leftOverTime, numUpdateSteps}
            $('#fps').text(stats.fps.toFixed(3));
            $('#fixed').text(stats.fixedDt.toFixed(3) / 1000);
            $('#elapsed').text(stats.elapsedTime.toFixed(3) / 1000);
            $('#simTime').text(stats.simulatedTime.toFixed(3) / 1000);
            $('#ticks').text(stats.numUpdateSteps);
            gameEngine.onFrameEnd(stats);
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

    await gameEngine.init();
    gameEngine.dispatchEvent(new Event(CustomEvents.GAME_STARTED));
    gameEngine.start();

    await createTabs(new Tabs(document.getElementById('tab-container'), { title: 'Editor' }), gameEngine, {
        entityManager: gameEngine.getSceneEntityManager(),
    });
}
