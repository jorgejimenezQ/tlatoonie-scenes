import { resolveConfiguration, waitForSpriteSheets } from '../utils/file';
import { ActionKeys, ActionTypes, CustomEvents, SceneNames, ScalePolicies, EntityTypes } from '../utils/enums';
import { Play_Scene } from '../scene/play_scene';
import { Scene } from '../scene/scene';
import { Vector } from 'vecti';
import { initUserInput } from '../utils/userInput';
import { Action } from '../action/action';
import { printSpriteCacheStats, SpriteCacheGPU } from '../utils/spriteCacheGPU';
import { getScaledSpriteLayout, getScaledSpriteSize } from '../utils/sprite';

class GameEngine extends EventTarget {
    /**
     * Map of all scenes in the game
     *
     * @type {Map<string, Play_Scene>}
     */
    #sceneMap = new Map();
    // #assets = new Assets();

    /**
     * The current scene that the game is on
     * @type {string}
     */
    #currentScene = '';
    #simulationSpeed = 1;
    #isRunning = true;
    #DEBUG;

    /**
     * The canvas context
     * @type {CanvasRenderingContext2D}
     */
    #canvasCTX;

    /**
     * The assets
     */
    #assets;
    #configPath;
    updates = 0;
    renders = 0;
    spriteCache = null;
    #pointerCoords = new Vector(0, 0);
    #frameCount = 0;

    /**
     * Sprite selection
     * {
     * details
     * }
     */
    #spriteSelected = null;

    /**
     * Creates a new GameEngine instance
     * @param {string} path - the path to the game configuration file
     * @param {CanvasRenderingContext2D} ctx - the canvas context to render the game on
     * @param {number} fps - the target frames per second for the game (default: 60)
     */
    constructor(path, ctx, debug = false) {
        super();

        this.#configPath = path;
        this.#canvasCTX = ctx;
        this.#DEBUG = debug;
    }

    async init() {
        this.#canvasCTX.imageSmoothingEnabled = false;
        this.#assets = await resolveConfiguration(this.#configPath);
        this.spriteCache = new SpriteCacheGPU(128 * 1024 * 1024);

        ``;
        try {
            // Wait for all images to load before proceeding
            await waitForSpriteSheets(this.#assets);

            // Prewarm the sprite cache
            for (let sheet of this.#assets.spriteSheets.values()) {
                let sheetImage = sheet.image;
                let frames = sheet.frames.map((frame) => {
                    const r = frame.frame;
                    return { sx: r.x, sy: r.y, sw: r.w, sh: r.h };
                });

                // Prewarm both orientations
                await this.spriteCache.prewarm(sheetImage, frames, 'none');
                await this.spriteCache.prewarm(sheetImage, frames, 'flipX');
            }

            console.log('assets loaded', this.#assets);
        } catch (err) {
            console.error(err);
            this.stop();
            this.dispatchEvent(new CustomEvent(CustomEvents.GAME_STOPPED));
        }

        this.changeScene(SceneNames.Play, new Play_Scene(this));
        initUserInput(this);
        console.log('sprite cache prewarmed', this.spriteCache.map, this.spriteCache.inflight);
        printSpriteCacheStats(this.spriteCache);

        this.#addEventListeners();
    }

    changeScene(
        sceneName,
        scene, // A reference to the scene
        endCurrentScene = false
    ) {
        if (endCurrentScene) {
            this.#sceneMap.get(this.#currentScene).hasEnded = true;
        }

        this.#currentScene = sceneName;
        if (!this.#sceneMap.has(sceneName)) {
            this.#sceneMap.set(sceneName, scene);
        } else {
            this.#sceneMap.set(sceneName, scene);
        }

        // Add an event listener to the scene to listen for the game stopped event
        this.#sceneMap.get(this.#currentScene).addEventListener(CustomEvents.GAME_STOPPED, () => {
            this.setPaused(true);
        });
    }

    fixedUpdate(dt) {
        // If the game was turned off stop the loop
        // TODO: FOLLOW-UP handle reset and game end better
        if (!this.isRunning()) return;

        // call the update for the current scene
        // TODO: uncomment once we have an inherited Scene
        this.#sceneMap.get(this.#currentScene).fixedUpdate(dt);
    }

    onFrameEnd({ fps, fixedDt, elapsedTime, simulatedTime, leftOverTime, numUpdateSteps }) {
        // stats: { fps, fixedDt, elapsedTime, simulatedTime, leftOverTime, numUpdateSteps}
        this.#sceneMap.get(this.#currentScene).onFrameEnd(elapsedTime, numUpdateSteps);
    }

    render(alpha) {
        if (!this.isRunning()) return;
        // Clear the canvas
        this.#canvasCTX.clearRect(0, 0, this.#canvasCTX.canvas.width, this.#canvasCTX.canvas.height);

        // Call the scene's render method
        this.#sceneMap.get(this.#currentScene).sRender(alpha);
    }

    quit() {
        // TODO: quit the game
        this.#isRunning = false;
    }

    stop() {
        // TODO: FOLLOW-UP pause or stop the game
        this.#isRunning = false;
    }

    start() {
        this.#isRunning = true;
    }

    isRunning() {
        return this.#isRunning;
    }
    getAssets() {
        return this.#assets;
    }

    /**
     * Gets the current scene that the game is on.
     * @returns {Scene} The current scene.
     */
    getCurrentScene() {
        return this.#sceneMap.get(this.#currentScene);
    }

    drawLine(point1, point2) {
        this.#canvasCTX.beginPath();
        this.#canvasCTX.moveTo(point1.x, point1.y);
        this.#canvasCTX.lineTo(point2.x, point2.y);
        this.#canvasCTX.stroke();
    }

    /**
     * Draw a sprite from a sprite sheet onto the game canvas.
     *
     * @param {string} sheetId - The id of the sprite sheet.
     * @param {string} spriteName - The name of the sprite to draw.
     * @param {Vector} pos - The position of the top left of the
     *     sprite in the canvas.
     * @param {Vector} size - The size of the sprite in the canvas.
     */
    async drawSprite(sheetId, spriteName, pos, scale) {
        const sheet = this.#assets.spriteSheets.get(sheetId);
        const img = sheet.image;
        const sprite = sheet.frameMap.get(spriteName);
        const frame = sprite.frame;
        const tr = new Vector(frame.w, frame.h);
        if (sheet.trimmedRect) {
            tr.x = sheet.trimmedRect.width;
            tr.y = sheet.trimmedRect.height;
        }

        // const sx = Math.abs(scale.x);
        // let scaledBox = getScaledSpriteSize(tr, scale, ScalePolicies.UNIFORM_Y, null);
        let { drawSize, logicalSizeScaled, trimmedTopLeft, trimmedCenter, kx, ky } = getScaledSpriteLayout(
            tr,
            new Vector(frame.w, frame.h),
            scale,
            ScalePolicies.UNIFORM_Y,
            pos,
            null
        );

        const bmp = await this.spriteCache.get(
            img,
            frame.x,
            frame.y,
            frame.w,
            frame.h,
            scale.x >= 0 ? 'none' : 'flipX'
        );

        this.#canvasCTX.drawImage(bmp, trimmedCenter.x, trimmedCenter.y, logicalSizeScaled.x, logicalSizeScaled.y);
    }

    /**
     * Draws a string onto the game canvas.
     *
     * @param {string} text - The string to draw.
     * @param {Vector} pos - The position of the top left of the
     *     text in the canvas.
     * @param {string} color - The color of the text.
     * @param {string} font - The css font string to use.
     */
    drawString(text, pos, color, font) {
        this.#canvasCTX.fillStyle = color;
        this.#canvasCTX.font = font;
        this.#canvasCTX.fillText(text, pos.x, pos.y);
    }

    loadAllImages() {
        this.#assets.textures.forEach((texture) => {});
    }

    getAnimations() {
        return this.#assets.animations;
    }

    getAnimation(animationName) {
        return this.#assets.animations.get(animationName);
    }

    getSpriteDimensions(sheetId) {
        return this.#assets.spriteSheets.get(sheetId).frames[0].frame;
    }

    /**
     * Returns the sprite data for a given sprite sheet and frame id.
     *
     * @param {string} sheetId - The id of the sprite sheet.
     * @param {string} frameId - The id of the frame.
     * @return {{w: number, h: number, x: number, y: number}} - The width, height, and
     *     position of the frame in the sprite sheet.
     */
    getSpriteData(sheetId, frameId) {
        // frame={
        // "w": 192,
        // "h": 168,
        // "x": 0,
        // "y": 0
        // }
        return this.#assets.spriteSheets.get(sheetId).frameMap.get(frameId).frame;
    }

    getImage(sheetId) {
        // this.#assets.
        return this.#assets.spriteSheets.get(sheetId).image;
    }

    /**
     * Draws a circle on the canvas.
     *
     * @param {Vector} pos - The center of the circle.
     * @param {number} radius - The radius of the circle.
     */
    drawCircle(pos, radius) {
        this.#canvasCTX.beginPath();
        this.#canvasCTX.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
        this.#canvasCTX.stroke();
        this.#canvasCTX.closePath();
    }

    drawCircleFilled(pos, radius, color) {
        this.#canvasCTX.beginPath();
        this.#canvasCTX.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
        this.#canvasCTX.fillStyle = color;
        this.#canvasCTX.fill();
        this.#canvasCTX.closePath();
    }

    /**
     * Draws a rectangle on the canvas.
     *
     * If `fillColor` is given, the rectangle is filled with that color. Otherwise,
     * the rectangle is only stroked with the given `color`.
     *
     * @param {Vector} pos - The top left of the rectangle.
     * @param {Vector} size - The size of the rectangle: size.x => width and size.y  => height
     * @param {string} [color='#000000'] - The color of the border.
     * @param {string} [fillColor] - The color to fill the rectangle with.
     */
    drawRect(pos, size, color = '#000000', fillColor = null) {
        if (fillColor) {
            this.#canvasCTX.fillStyle = fillColor;
        }

        if (!fillColor) {
            this.#canvasCTX.strokeStyle = color;
            this.#canvasCTX.strokeRect(pos.x, pos.y, size.x, size.y);
        } else {
            this.#canvasCTX.fillRect(pos.x, pos.y, size.x, size.y);
            this.#canvasCTX.strokeRect(pos.x, pos.y, size.x, size.y);
        }
    }

    /*****************************************************************************
     * Getters and Setters
     ******************************************************************************/

    getSceneEntityManager() {
        const scene = this.getCurrentScene();
        return scene.entityManager;
    }

    getImage(sheetId) {
        // this.#assets.
        return this.#assets.spriteSheets.get(sheetId).image;
    }

    getSpriteTrimmedRect(spriteId) {
        return this.#assets.spriteSheets.get(spriteId).trimmedRect || null;
    }

    /**
     * The width of the canvas.
     *
     * @returns {number} The width of the canvas.
     */
    get width() {
        return this.#canvasCTX.canvas.width;
    }

    getTest() {
        console.log('testing get ');
    }

    /**
     * The height of the canvas.
     *
     * @returns {number} The height of the canvas.
     */

    get height() {
        return this.#canvasCTX.canvas.height;
    }

    get assets() {
        return this.#assets;
    }

    /** Device pixel ratio in effect for the main ctx */
    get dpr() {
        const m = this.#canvasCTX.getTransform?.();
        return m && m.a ? m.a : window.devicePixelRatio || 1;
    }
    /**
     * The width of the canvas in logical (CSS) units.
     *
     * This is the width of the canvas, divided by the device pixel ratio.
     *
     * @returns {number} The width of the canvas in logical units.
     */
    get logicalWidth() {
        return this.width / this.dpr;
    }

    get logicalHeight() {
        return this.height / this.dpr;
    }

    /**
     * The canvas context (2D drawing context) for the game canvas.
     *
     * @returns {CanvasRenderingContext2D} The canvas context.
     */
    get ctx() {
        return this.#canvasCTX;
    }

    /**
     * The current x-coordinate of the pointer in the game canvas.
     *
     * @returns {number} The x-coordinate of the pointer.
     */
    get pointerX() {
        return this.#pointerCoords.x;
    }

    /**
     * The current y-coordinate of the pointer in the game canvas.
     *
     * @returns {number} The y-coordinate of the pointer.
     */
    get pointerY() {
        return this.#pointerCoords.y;
    }

    /**
     * Gets the current pointer position as a Vector.
     *
     * @returns {Vector} The current pointer position.
     */
    get pointerPosition() {
        return this.#pointerCoords;
    }

    /*----------------------------------------------------------------------------
     * helper functions
     *-----------------------------------------------------------------------------*/

    #addEventListeners() {
        /********************   Window Events          *******************/
        this.addEventListener(CustomEvents.WINDOW_RESIZED, (e) => {
            // resizeCanvas(this.#canvasCTX.canvas, this.#canvasCTX);
        });

        /********************   Keyboard/button Events *******************/
        this.addEventListener(CustomEvents.ACTION_START, (e) => {
            if (e.detail.repeat) return;
            if (e.detail.key == ActionKeys.p) {
                if (this.isRunning()) {
                    this.stop();
                    this.dispatchEvent(new CustomEvent(CustomEvents.GAME_STOPPED));
                    return;
                }
                if (!this.isRunning()) {
                    this.start();
                    this.dispatchEvent(new CustomEvent(CustomEvents.GAME_STARTED));
                    return;
                }
                return;
            }

            let scene = this.#sceneMap.get(this.#currentScene);
            if (!scene.actionMap.has(e.detail.key)) return;
            let action = new Action(scene.actionMap.get(e.detail.key), ActionTypes.START);
            scene.actionEnqueue(action);
        });

        this.addEventListener(CustomEvents.ACTION_END, (e) => {
            let scene = this.#sceneMap.get(this.#currentScene);
            if (!scene.actionMap.has(e.detail.key)) return;
            let action = new Action(scene.actionMap.get(e.detail.key), ActionTypes.END);
            scene.actionEnqueue(action);
        });

        /********************   Pointer Events *******************/

        this.addEventListener(CustomEvents.POINTER_MOVE, (e) => {
            // console.log(e.detail);
            this.#pointerCoords = new Vector(e.detail.x, e.detail.y);
            let scene = this.#sceneMap.get(this.#currentScene);
            if (!scene.actionMap.has(ActionKeys.pointerMove)) return;

            let action = new Action(scene.actionMap.get(ActionKeys.pointerMove), ActionTypes.END);
            action.payload = this.#pointerCoords;
            scene.sDoActionImm(action);
        });

        this.addEventListener(CustomEvents.POINTER_DOWN, (e) => {
            let scene = this.#sceneMap.get(this.#currentScene);
            if (!scene.actionMap.has(ActionKeys.pointerDown)) return;

            let action = new Action(scene.actionMap.get(ActionKeys.pointerDown), ActionTypes.START);
            action.payload = new Vector(e.detail.x, e.detail.y);
            scene.sDoActionImm(action);

            // **** event:sprite select
            if (this.#spriteSelected) {
                console.log('placing sprite');
                console.info(this.#spriteSelected);
                scene.placeSpriteEntityGrid(
                    EntityTypes.GROUND,
                    e.detail.x,
                    e.detail.y,
                    this.#spriteSelected.sheetId,
                    this.#spriteSelected.frame,
                    false
                );
                this.#spriteSelected = null;
            }
        });

        this.addEventListener(CustomEvents.POINTER_UP, (e) => {
            let scene = this.#sceneMap.get(this.#currentScene);
            if (!scene.actionMap.has(ActionKeys.pointerUp)) return;

            let action = new Action(scene.actionMap.get(ActionKeys.pointerUp), ActionTypes.START);
            scene.sDoActionImm(action);
        });

        /******************** Debugging   Sprite Events ******************* */
        if (this.#DEBUG) {
            this.addEventListener(CustomEvents.SPRITE.SELECT, (e) => {
                this.#spriteSelected = {
                    sheetId: e.detail.sheetId,
                    frame: e.detail.frame.frameName,
                    // position: new Vector(e.detail.x, e.detail.y),
                };
                console.log('sprite selected', this.#spriteSelected);
            });
        }
    }
}

export { GameEngine };
