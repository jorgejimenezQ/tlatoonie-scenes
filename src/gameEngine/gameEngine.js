import { resolveConfiguration, waitForSpriteSheets } from '../utils/file';
import { ActionKeys, ActionTypes, CustomEvents, SceneNames } from '../utils/enums';
import { Play_Scene } from '../scene/play_scene';
import { Scene } from '../scene/scene';
import { Vector } from 'vecti';
import { initUserInput } from '../utils/userInput';
import { Action } from '../action/action';
import { printSpriteCacheStats, SpriteCacheGPU } from '../utils/spriteCacheGPU';

class GameEngine extends EventTarget {
    /**
     * Map of all scenes in the game
     *
     * @type {Map<string, Scene>}
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
    #fps;
    updates = 0;
    renders = 0;
    spriteCache = null;
    #pointerCoords = new Vector(0, 0);

    constructor(path, ctx, fps = 60) {
        super();

        this.#fps = fps;
        this.#configPath = path;
        this.#canvasCTX = ctx;
    }

    async init() {
        this.#canvasCTX.imageSmoothingEnabled = false;
        this.#assets = await resolveConfiguration(this.#configPath);
        this.spriteCache = new SpriteCacheGPU(128 * 1024 * 1024);

        // resizeCanvasForDPR(this.#canvasCTX.canvas, this.#canvasCTX);

        // Wait for all images to load before proceeding
        await waitForSpriteSheets(this.#assets);

        for (let animation of this.getAnimations().values()) {
            let sheetImage = this.getImage(animation.sheetId);
            let frames = animation.frames.map((frame) => {
                const r = this.getSpriteData(animation.sheetId, frame.frame);
                return { sx: r.x, sy: r.y, sw: r.w, sh: r.h };
            });

            // Prewarm both orientations
            await this.spriteCache.prewarm(sheetImage, frames, 'none');
            await this.spriteCache.prewarm(sheetImage, frames, 'flipX');
        }

        console.log('assets loaded', this.#assets);
        // console.log('sprite cache prewarmed', this.spriteCache.map, this.spriteCache.inflight);
        // this.#canvasCTX.drawImage(this.#assets.spriteSheets.get('knight').image, 0, 0);
        this.changeScene(SceneNames.Play, new Play_Scene(this));
        initUserInput(this);

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

    update(dt) {
        if (!this.isRunning()) return;
        // Handle user input early to capture key presses even when paused
        this.sUserInput();

        // If the game was turned off stop the loop
        // TODO: FOLLOW-UP handle reset and game end better
        if (!this.isRunning()) return;

        // call the update for the current scene
        // TODO: uncomment once we have an inherited Scene
        this.#sceneMap.get(this.#currentScene).update(dt);
    }

    render(alpha) {
        if (!this.isRunning()) return;
        // Clear the canvas
        this.#canvasCTX.clearRect(0, 0, this.#canvasCTX.canvas.width, this.#canvasCTX.canvas.height);

        // this.#canvasCTX.font = '12px serif';
        // this.#canvasCTX.fillStyle = 'green';
        // this.#canvasCTX.fillText(this.test.prop1, 10, 50);

        // Call the scene's render method
        // TODO: uncomment once we have an inherited Scene
        // this.getCurrentScene.sRender(alpha);
        this.#sceneMap.get(this.#currentScene).sRender(alpha);
    }

    sUserInput() {
        // TODO: handle user input
        // if (this.#keys['KeyG']) {
        //     // dispatch a custom stopped event
        //     this.dispatchEvent(new Event(CustomEvents.GAME_STOPPED));
        //     // TODO: FOLLOW-UP pause or stop the game
        //     this.#isRunning = false;
        // }
        // if (this.#keys['KeyR']) {
        //     // dispatch a custom stopped event
        //     this.dispatchEvent(new Event(CustomEvents.GAME_STOPPED));
        //     // TODO: FOLLOW-UP pause or stop the game
        //     this.#isRunning = false;
        // }
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
        let spriteSheet = this.#assets.spriteSheets.get(sheetId);
        let img = spriteSheet.image;
        let sprite = spriteSheet.frameMap.get(spriteName);
        let size = new Vector(sprite.frame.w * scale.x, sprite.frame.h * scale.y);
        let bpm = await this.spriteCache.get(
            img,
            sprite.frame.x,
            sprite.frame.y,
            sprite.frame.w,
            sprite.frame.h,
            scale.x >= 0 ? 'none' : 'flipX'
        );

        this.#canvasCTX.drawImage(bpm, pos.x, pos.y, size.x, size.y);
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

    getImage(sheetId) {
        // this.#assets.
        return this.#assets.spriteSheets.get(sheetId).image;
    }

    /**
     * The width of the canvas.
     *
     * @returns {number} The width of the canvas.
     */
    get width() {
        return this.#canvasCTX.canvas.width;
    }
    /**
     * The height of the canvas.
     *
     * @returns {number} The height of the canvas.
     */

    get height() {
        return this.#canvasCTX.canvas.height;
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
            scene.sDoAction(action);
        });

        this.addEventListener(CustomEvents.ACTION_END, (e) => {
            let scene = this.#sceneMap.get(this.#currentScene);
            if (!scene.actionMap.has(e.detail.key)) return;

            let action = new Action(scene.actionMap.get(e.detail.key), ActionTypes.END);
            scene.sDoAction(action);
        });

        /********************   Pointer Events *******************/

        this.addEventListener(CustomEvents.POINTER_MOVE, (e) => {
            // console.log(e.detail);
            this.#pointerCoords = new Vector(e.detail.x, e.detail.y);
            let scene = this.#sceneMap.get(this.#currentScene);
            if (!scene.actionMap.has(ActionKeys.pointerMove)) return;

            let action = new Action(scene.actionMap.get(ActionKeys.pointerMove), ActionTypes.END);
            action.payload = this.#pointerCoords;
            scene.sDoAction(action);
        });

        this.addEventListener(CustomEvents.POINTER_DOWN, (e) => {
            let scene = this.#sceneMap.get(this.#currentScene);
            if (!scene.actionMap.has(ActionKeys.pointerDown)) return;

            let action = new Action(scene.actionMap.get(ActionKeys.pointerDown), ActionTypes.START);
            action.payload = new Vector(e.detail.x, e.detail.y);
            scene.sDoAction(action);
        });

        this.addEventListener(CustomEvents.POINTER_UP, (e) => {
            let scene = this.#sceneMap.get(this.#currentScene);
            if (!scene.actionMap.has(ActionKeys.pointerUp)) return;

            let action = new Action(scene.actionMap.get(ActionKeys.pointerUp), ActionTypes.START);
            scene.sDoAction(action);
        });
    }
}

function resizeCanvasForDPR(canvas, ctx) {
    const dpr = window.devicePixelRatio || 1;
    const { width: cssW, height: cssH } = canvas.getBoundingClientRect();
    const w = Math.round(cssW * dpr);
    const h = Math.round(cssH * dpr);
    console.log(w, h);
    console.log(canvas.width, canvas.height);
    if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // draw in CSS units
        ctx.imageSmoothingEnabled = false;
    }
}

export { GameEngine };
