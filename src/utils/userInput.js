import { ActionEnums, KeyCodes } from './enums';
import { Action } from '../action/action';
import { GameEngine } from '../gameEngine/gameEngine';
import { CustomEventEnums } from './enums';
import { Scene } from '../scene/scene';

class InputHandler extends EventTarget {
    /** @type {GameEngine} */
    #game;

    /** @type {Map<KeyCodes, boolean>} */
    #keysPressed = new Map();

    /**
     * Initializes a new InputHandler instance.
     *
     * @param {GameEngine} game - The GameEngine instance to associate with this InputHandler.
     * The game should extend EventTarget.
     */
    constructor(game) {
        super();

        // game should extend EventTarget
        this.#game = game;
        this.initUserInput();
    }

    /**
     * Checks if a key is currently pressed.
     *
     * @param {KeyCodes} key - The key to check of type enum (KeyCodes).
     * @returns {boolean} true if the key is currently pressed, false otherwise.
     */
    isKeyPressed(key) {
        return !!this.#keysPressed.get(key);
    }

    /**
     * Initializes the user input handlers.
     *
     * This method adds event listeners for the following events:
     *   - keydown: Dispatches a CustomEvent with type ACTION_START and detail { key, repeat }.
     *   - keyup: Dispatches a CustomEvent with type ACTION_END and detail { key, repeat }.
     *   - pointerdown: Dispatches a CustomEvent with type POINTER_DOWN and detail { x, y }.
     *   - pointerup: Dispatches a CustomEvent with type POINTER_UP and detail { x, y }.
     *   - pointermove: Dispatches a CustomEvent with type POINTER_MOVE and detail { x, y }.
     *
     * Note that the event listeners are added to the window and a canvas element.
     * The canvas element is expected to be the main game canvas.
     */
    initUserInput() {
        /** @type {HTMLCanvasElement} */
        const canvas = document.getElementById('canvas');

        window.addEventListener('keydown', (e) => {
            // e.preventDefault();
            this.#keysPressed.set(e.key, true);

            this.#game.dispatchEvent(
                new CustomEvent(CustomEventEnums.ACTION_START, { detail: { key: e.key, repeat: e.repeat } })
            );
        });

        window.addEventListener('keyup', (e) => {
            // e.preventDefault();
            this.#keysPressed.delete(e.key);

            this.#game.dispatchEvent(
                new CustomEvent(CustomEventEnums.ACTION_END, { detail: { key: e.key, repeat: e.repeat } })
            );
        });

        // // src/utils/userInput.js
        canvas.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            const { x, y } = this.#getMouseInCanvas(e, canvas);

            this.#game.dispatchEvent(new CustomEvent(CustomEventEnums.POINTER_DOWN, { detail: { x, y } }));
        });

        canvas.addEventListener('pointerup', (e) => {
            e.preventDefault();
            const { x, y } = this.#getMouseInCanvas(e, canvas);

            this.#game.dispatchEvent(new CustomEvent(CustomEventEnums.POINTER_UP, { detail: { x, y } }));
        });

        canvas.addEventListener('pointermove', (e) => {
            e.preventDefault();
            const { x, y } = this.#getMouseInCanvas(e, canvas);

            this.#game.dispatchEvent(new CustomEvent(CustomEventEnums.POINTER_MOVE, { detail: { x, y } }));
        });
    }

    /**
     * Gets the mouse coordinates relative to the canvas element. The coordinates
     * are calculated from the clientX and clientY coordinates of the event object,
     * and are scaled to the size of the canvas element's backing buffer.
     *
     * @param {MouseEvent} e - The mouse event.
     * @param {HTMLCanvasElement} canvas - The canvas element.
     * @returns {Object} - An object with two properties, x and y, which are the
     *     coordinates of the mouse relative to the canvas element.
     */
    #getMouseInCanvas(e, canvas) {
        const rect = canvas.getBoundingClientRect(); // CSS box (includes border)
        const style = getComputedStyle(canvas);

        const padL = parseFloat(style.paddingLeft) || 0;
        const padT = parseFloat(style.paddingTop) || 0;
        const padR = parseFloat(style.paddingRight) || 0;
        const padB = parseFloat(style.paddingBottom) || 0;

        const bL = parseFloat(style.borderLeftWidth) || 0;
        const bT = parseFloat(style.borderTopWidth) || 0;
        const bR = parseFloat(style.borderRightWidth) || 0;
        const bB = parseFloat(style.borderBottomWidth) || 0;

        // Mouse in CSS pixels, relative to the content box
        const xCss = e.clientX - rect.left - bL - padL;
        const yCss = e.clientY - rect.top - bT - padT;

        // // Content-box size in CSS pixels
        // const contentW = rect.width - (padL + padR + bL + bR);
        // const contentH = rect.height - (padT + padB + bT + bB);

        // // Scale to the backing buffer
        // const scaleX = canvas.width / contentW;
        // const scaleY = canvas.height / contentH;

        // return { x: xCss * scaleX, y: yCss * scaleY };
        return { x: xCss, y: yCss };
    }

    // function addAction(e, type, scene) {
    //     // If the current scene does not contain the key as an action
    //     if (!scene.getActionMap().get(e.key)) return;
    //     scene.doAction(scene.getActionMap().get(e.key), type);
    // }
}

export default InputHandler;
