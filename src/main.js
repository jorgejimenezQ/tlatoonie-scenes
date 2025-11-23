import GameLoop from '@tenoch_code/tlaloopi';
import { GameEngine } from './gameEngine/gameEngine';
import { ComponentTypes, CustomEventEnums, EntityFlags } from './utils/enums';
import { Tabs } from './ui/tabs/tabs';
import { createTabs } from './ui/tabs/createTabs';
import { PlayScene } from './scene/playScene';
import { Entity, EntityManager } from './entityManager/entityManager';
import {
    AnimationContainer as CAnimationContainerType,
    BoundingBox,
    Flags,
    Interpolation,
    Sprite,
} from './components/components';
import { Animation } from './animation/animation';
import { printJSON, printJSONToFile } from './utils/file';

const debug = true;
let ctx = document.getElementById('canvas').getContext('2d');
// let path = '${import.meta.env.BASE_URL}assets/config.json';
let envUrl = import.meta.env.BASE_URL;
console.log(envUrl);
let gameEngine = new GameEngine(envUrl + 'assets/config.json', ctx, debug);

function resizeCanvas(canvas, ctx) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect(); // CSS pixels, fractional

    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));

    // Draw in CSS pixel units; prevents double-scaling.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener('resize', (e) => {
    gameEngine.dispatchEvent(new CustomEvent(CustomEventEnums.WINDOW_RESIZED));
    resizeCanvas(canvas, ctx);
});
resizeCanvas(canvas, ctx);

// onload
$(async function () {
    $('#tab-container').draggable();
    await startGame();
    /** @type {Play_Scene} */
    const scene = gameEngine.getCurrentScene();
    $('#print-scene').on('click', () => {
        printSceneJson(gameEngine);
    });
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
    gameEngine.addEventListener(CustomEventEnums.GAME_STOPPED, () => {
        // console.log('the game was stopped');
        gameLoop.stop();
    });

    // Listen for the game started event and start the game loop
    gameEngine.addEventListener(CustomEventEnums.GAME_STARTED, () => {
        gameLoop.start();
    });

    await gameEngine.init();
    gameEngine.dispatchEvent(new Event(CustomEventEnums.GAME_STARTED));
    gameEngine.start();

    await createTabs(new Tabs(document.getElementById('tab-container'), { title: 'Editor' }), gameEngine, {
        entityManager: gameEngine.getSceneEntityManager(),
    });

    const scene = gameEngine.getCurrentScene();
    gameEngine.dispatchEvent(
        new CustomEvent(CustomEventEnums.ENTITIES.UPDATED, {
            detail: {
                count: scene.entityManager.getAllEntities().length,
                entities: scene.entityManager.getAllEntities(),
            },
        })
    );
}

const printSceneJson = (game) => {
    /** @type {Play_Scene} */
    const scene = game.getCurrentScene();
    /** @type {EntityManager} */
    const entityManager = game.getCurrentScene().entityManager;
    /** @type {Entity[]} */
    const entities = entityManager.getAllEntities();
    const entityJson = [];

    for (let i = 0; i < entities.length; i++) {
        /** @type {Entity} */
        const entity = entities[i];
        console.log(entity);
        // Create the entity object
        const obj = {};
        // obj[entities[i].id] = { id: entities[i].id, entityTag: entities[i].tag };
        // console.log(entities[i].id);
        for (const [type, component] of entities[i].getComponents()) {
            const config = componentToConfig(type, component, scene, entity);
            if (config) obj[type] = config;
        }
        obj.entityId = entity.id;
        obj.tag = entity.tag;
        console.log(obj);
        entityJson.push(obj);
    }

    printJSON(entityJson);
    printJSONToFile(entityJson);
};

const componentToConfig = (type, component, scene, entity) => {
    switch (type) {
        case ComponentTypes.CAnimation:
            /** @type {CAnimationContainerType} */
            const c = component;
            console.log(c);
            console.log(c.animationStack[0].animation.name);
            return component;
        case ComponentTypes.CBoundingBox:
            return { rectangle: component.rectangle, offset: component.offset };
        case ComponentTypes.CCollision:
            return;
        case ComponentTypes.CFlags:
            return component.mask;
        case ComponentTypes.CGravity:
            return component.gravity;
        case ComponentTypes.CInput:
            break;
        case ComponentTypes.CInterpolation:
            /** @type {Interpolation} */
            component;
            return component.type;
        case ComponentTypes.CLifespan:
            return component.duration;
        case ComponentTypes.CScore:
            break;
        case ComponentTypes.CSprite:
            return { sheetId: component.sheetId, frame: component.frame };
        case ComponentTypes.CSpriteDimensions:
            return { dimensions: component.dimensions, trimmedRectangle: component.trimmedRect };
        case ComponentTypes.CState:
            return component.state;
        case ComponentTypes.CTraits:
            return component.set;
        case ComponentTypes.CTransform:
            const grid = scene.getEntityTile(entity);
            return {
                position: component.position,
                velocity: component.velocity,
                scale: component.scale,
                angle: component.angle,
                hSpeed: component.hSpeed,
                vSpeed: component.vSpeed,
                grid: { x: grid.x, y: grid.y },
            };
    }
};

// TODO: @Add error handling and logging
