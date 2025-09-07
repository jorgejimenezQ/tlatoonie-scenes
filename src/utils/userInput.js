import { ActionEnums } from './enums';
import { Action } from '../action/action';
import { GameEngine } from '../gameEngine/gameEngine';
import { CustomEvents } from './enums';
import { Scene } from '../scene/scene';

/**
 * Initializes event listeners for user input on the window, document, and canvas elements.
 * The listeners are for 'keydown', 'keyup', and 'mousedown' events.
 *
 * @param {GameEngine} game - The game engine object.
 *
 * @since 0.0.1
 */
function initUserInput(game) {
    const canvas = document.getElementById('canvas');
    let keys = {};

    window.addEventListener('keydown', (e) => {
        keys[e.key] = true;

        // If the current scene does not contain the key as an action
        // if (!currScene.getActionMap().get(e.key)) return;
        // currScene.doAction(new Action(currScene.getActionMap().get(e.key), ActionEnums.START));
        game.dispatchEvent(new CustomEvent(CustomEvents.ACTION_START, { detail: { key: e.key, repeat: e.repeat } }));
    });

    window.addEventListener('keyup', (e) => {
        keys[e.key] = false;
        // If the current scene does not contain the key as an action
        // if (!currScene.getActionMap().get(e.key)) return;
        // currScene.doAction(new Action(currScene.getActionMap().get(e.key), ActionEnums.END));
        game.dispatchEvent(new CustomEvent(CustomEvents.ACTION_END, { detail: { key: e.key, repeat: e.repeat } }));
    });

    // // src/utils/userInput.js
    canvas.addEventListener('pointerdown', (e) => {
        const { x, y } = getMouseInCanvas(e, canvas);

        game.dispatchEvent(new CustomEvent(CustomEvents.POINTER_DOWN, { detail: { x, y } }));
    });

    canvas.addEventListener('pointerup', (e) => {
        const { x, y } = getMouseInCanvas(e, canvas);

        game.dispatchEvent(new CustomEvent(CustomEvents.POINTER_UP, { detail: { x, y } }));
    });

    canvas.addEventListener('pointermove', (e) => {
        const { x, y } = getMouseInCanvas(e, canvas);

        game.dispatchEvent(new CustomEvent(CustomEvents.POINTER_MOVE, { detail: { x, y } }));
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
function getMouseInCanvas(e, canvas) {
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

    // Content-box size in CSS pixels
    const contentW = rect.width - (padL + padR + bL + bR);
    const contentH = rect.height - (padT + padB + bT + bB);

    // Scale to the backing buffer
    const scaleX = canvas.width / contentW;
    const scaleY = canvas.height / contentH;

    return { x: xCss * scaleX, y: yCss * scaleY };
}

// function addAction(e, type, scene) {
//     // If the current scene does not contain the key as an action
//     if (!scene.getActionMap().get(e.key)) return;
//     scene.doAction(scene.getActionMap().get(e.key), type);
// }

export { initUserInput };
