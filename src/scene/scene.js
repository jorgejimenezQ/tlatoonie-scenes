import { Action } from '../action/action';
import { EntityManager } from '../entityManager/entityManager';
import { GameEngine } from '../gameEngine/gameEngine';
import { SceneTags } from '../utils/enums';
/**
 * @param {GameEngine} gameEngine
 *
 * @description Base class for scenes in the game
 */
class Scene extends EventTarget {
    #paused = false;

    /** @type {EntityManager} */
    entityManager = new EntityManager();

    /** @type {GameEngine} */
    gameEngine = null;
    /**
     * @description Map of action name to Action object
     * @type {Map<string, Action>}
     */
    actionMap = new Map();
    hasEnded = false;
    currentFrame = 0;
    width = 0;
    height = 0;
    tag = SceneTags.SIMPLE;

    onEnd() {
        throw new Error('Function not implemented. Child classes must implement onEnd and setPaused');
    }
    setPaused() {
        throw new Error('Function not implemented. Child classes must implement onEnd and setPaused');
    }

    /**
     * Construct a new Scene object.
     *
     * @param {GameEngine} gameEngine - the GameEngine to associate with this Scene
     */
    constructor(gameEngine, tag) {
        super();
        this.gameEngine = gameEngine;

        this.height = gameEngine.height;
        this.width = gameEngine.width;
        this.tag = tag;
    }

    /**
     * Handle an action as specified by the action map.
     *
     * @param {Action} action - the action to handle
     */
    sQueue(action) {
        throw new Error('Function not implemented. Child classes must implement onEnd and setPaused');
    }

    sRender(alpha) {
        throw new Error('Function not implemented. Child classes must implement onEnd and setPaused');
    }

    doAction(action) {
        this.sDoAction(action);
    }

    simulate(frames) {}

    registerAction(inputKey, actionName) {
        this.actionMap.set(inputKey, actionName);
    }

    getWidth() {
        return this.width;
    }
    getHeight() {
        return this.height;
    }
    getCurrentFrame() {
        return this.currentFrame;
    }
    hasEnded() {
        return this.hasEnded;
    }
    getActionMap() {
        return this.actionMap;
    }
    drawLine(point1, point2) {
        this.game.drawLine(point1, point2);
    }
}

export { Scene };
