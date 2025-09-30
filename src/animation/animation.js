import { Vector } from 'vecti';
import { GameEngine } from '../gameEngine/gameEngine';

class Animation {
    /**
     * TODO: Refactor animation timing to use real elapsed time (dtVar) instead of tick counts. Will be found in the onEnd callback of the game loop.
     *
     * Why:
     * - Right now animations advance based on "number of update ticks".
     * - This makes them frame-rate dependent: if the game loop slows (e.g., 120 Hz → 60 Hz),
     *   animations also slow down, because fewer ticks happen per second.
     *
     * Goal:
     * - Use the variable delta time provided by the game loop (`deltaTime` between frames, in seconds).
     * - Accumulate dtVar inside Animation until it reaches the duration of one animation frame
     *   (e.g. 1 / animFPS), then advance the sprite frame.
     * - This makes animation playback tied to wall-clock time, not tick rate → animations
     *   run at a consistent speed across machines and during FPS dips.
     *
     * Plan:
     * 1. Pass both fixed dt (dtFixed) and variable dt (dtVar) into gameEngine.update().
     * 2. Forward dtVar down to Scene.update() and Animation.update().
     * 3. Inside Animation, add an accumulator field (e.g. this._accum).
     * 4. On each update, do:
     *      this._accum += dtVar;
     *      while (this._accum >= 1 / this.#animFPS) {
     *          this._accum -= 1 / this.#animFPS;
     *          this.#frameIndex = (this.#frameIndex + 1) % this.#numFrames;
     *      }
     * 5. Keep physics/game logic tied to dtFixed for determinism, but let animations
     *    and tweening use dtVar for smooth, real-time motion.
     *
     * Result:
     * - Animations remain steady at the intended FPS (e.g., 12 fps) regardless of game loop speed.
     * - Frame drops won’t cause sprite animations to slow down; they’ll catch up naturally.
     */

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
    }

    // 60ps / 10ps = 6ps

    /**
     * Updates the animation by incrementing the frame index by one and
     * adjusting it according to the speed and number of frames.
     * @param {number} elapsedTime - the time delta in milliseconds
     */
    update(elapsedTime) {
        if (this.#numberOfFrames === 1) return;
        // TODO: Use the elapsed time variable in the gameLoop.onEnd function to acc
        this.#simTime += elapsedTime / 1000;
        while (this.#simTime >= this.#frameTime) {
            this.#simTime -= this.#frameTime;
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
        // TODO: detect when the animation has ended (last frame was played)
    }

    /**
     * Returns the name of the animation.
     *
     * @return {string} The name of the animation.
     */
    get name() {
        return this.#name;
    }

    /**
     * Resets the animation to its initial state, setting the frame index to 0.
     */
    reset() {
        this.#frameIndex = 0;
        this.#currentFrame = 0;
    }
}

export { Animation };
