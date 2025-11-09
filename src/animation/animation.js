import { Vector } from 'vecti';
import { GameEngine } from '../gameEngine/gameEngine';

class Animation {
    // TODO: Tie the animation duration to a different factor (e.g., jumping, attacks, etc)
    // TODO: use repeat bool to end or repeat animation
    #numberOfFrames = 1;
    #currentFrame = 0;
    #duration = 8; // frames between frames
    #frameSize = new Vector(1, 1);
    #animFPS = 10;

    #name = '';
    #animationConfig;

    /**
     * @type {GameEngine}
     */
    #gameEngine;
    #frameIndex = 0;
    #simTime = 0;
    #frameTime = 0;
    #animationCompleted = false;
    onCompleteState = null;
    /**
     * Constructs a new Animation with the given name and animation config
     * @param {string} name - the name of the animation
     * @param {Object} animationConfig - an object containing the configuration for the animation
     */
    constructor(name, animationConfig, gameEngine) {
        this.#gameEngine = gameEngine;
        this.#name = name;
        this.#animationConfig = animationConfig;
        this.#animFPS = animationConfig.frameRate;
        this.#numberOfFrames = animationConfig.frames.length;
        this.#duration = animationConfig.speed;
        this.#frameTime = 1 / this.#animFPS;

        console.log(animationConfig);
    }

    // 60ps / 10ps = 6ps

    /**
     * Updates the animation by incrementing the frame index by one and
     * adjusting it according to the speed and number of frames.
     * @param {number} elapsedTime - the time delta in milliseconds
     */
    update(elapsedTime) {
        // TODO: Use the elapsed time variable in the gameLoop.onEnd function to acc
        if (this.#numberOfFrames === 1) return;
        // Guard in case another update is called once the animation is over.
        if (this.#animationCompleted) {
            console.error('INFO: An animation that has a non-repeat is called!');
            return;
        }

        this.#simTime += elapsedTime / 1000;
        while (this.#simTime >= this.#frameTime) {
            this.#simTime -= this.#frameTime;

            // If the animation does not repeat and it has exhausted all frames, we signal it is over.
            if (!this.repeats && this.#frameIndex + 2 > this.#numberOfFrames) {
                this.#animationCompleted = true;
                continue;
            }

            this.#frameIndex = (this.#frameIndex + 1) % this.#numberOfFrames;
        }
    }

    /**
     * Gets the current frame of the animation.
     *
     * @return {{frame: string, sheetId: string}} - an object containing the frame id and sheet id
     */
    getCurrentFrame() {
        return {
            frame: this.#animationConfig.frames[this.#frameIndex].frame,
            sheetId: this.#animationConfig.sheetId,
        };
    }

    hasEnded() {
        return this.#animationCompleted;
    }

    /**
     * Returns the name of the animation.
     *
     * @return {string} The name of the animation.
     */
    get name() {
        return this.#name;
    }

    get animationConfig() {
        return this.#animationConfig;
    }

    get repeats() {
        return this.#animationConfig.repeat == 1;
    }

    stop() {
        this.#animationCompleted = true;
        return this;
    }
    /**
     * Resets the animation to its initial state, setting the frame index to 0.
     */
    reset() {
        this.#frameIndex = 0;
        this.#currentFrame = 0;
        this.#animationCompleted = false;
        return this;
    }
}

export { Animation };
